import { useState, useEffect, useRef, useCallback } from 'react';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { ID } from 'appwrite';

// Signaling message types
type SignalMessage = {
    type: 'offer' | 'answer' | 'ice-candidate' | 'end-call';
    targetUserId: string;
    payload: any;
    senderId: string;
    senderName: string;
};

export const useWebRTC = (currentUserId: string | undefined, currentUserName: string | undefined) => {
    const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; offer: any } | null>(null);
    const [callActive, setCallActive] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionState, setConnectionState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');

    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // ICE Servers (STUN)
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    };

    const cleanupCall = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setCallActive(false);
        setConnectionState('idle');
        setRemoteStream(null);
        setIncomingCall(null);
    }, []);

    useEffect(() => {
        return () => {
            cleanupCall();
        };
    }, [cleanupCall]);

    const sendSignal = async (type: SignalMessage['type'], payload: any, targetUserId: string) => {
        if (!currentUserId || !currentUserName) return;

        try {
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.MESSAGES_COLLECTION_ID,
                ID.unique(),
                {
                    body: JSON.stringify({ type, payload, targetUserId, senderId: currentUserId, senderName: currentUserName }),
                    userId: currentUserId,
                    username: currentUserName,
                    // We can't actually hide messages easily in Appwrite without a specific attribute. 
                    // We'll filter them client-side based on body content.
                }
            );
        } catch (err) {
            console.error("Failed to send signal:", err);
        }
    };

    const initiateCall = async (targetUserId: string) => {
        setConnectionState('calling');
        setCallActive(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            const pc = new RTCPeerConnection(iceServers);
            peerConnectionRef.current = pc;

            // Add local tracks
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Handle remote stream
            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendSignal('ice-candidate', event.candidate, targetUserId);
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') setConnectionState('connected');
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') cleanupCall();
            };

            // Create Offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal('offer', offer, targetUserId);

        } catch (err) {
            console.error("Error starting call:", err);
            cleanupCall();
        }
    };

    const acceptCall = async () => {
        if (!incomingCall || !currentUserId) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            const pc = new RTCPeerConnection(iceServers);
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => setRemoteStream(event.streams[0]);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendSignal('ice-candidate', event.candidate, incomingCall.callerId);
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') setConnectionState('connected');
                if (pc.connectionState === 'disconnected') cleanupCall();
            };

            // Set Remote Description (Offer)
            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

            // Create Answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal('answer', answer, incomingCall.callerId);

            setCallActive(true);
            setIncomingCall(null);

        } catch (err) {
            console.error("Error accepting call:", err);
            cleanupCall();
        }
    };

    const rejectCall = () => {
        if (incomingCall) {
            sendSignal('end-call', {}, incomingCall.callerId);
            setIncomingCall(null);
        }
    };

    const handleSignalMessage = async (message: any) => {
        // Only process messages created by others
        if (message.userId === currentUserId) return;

        let signal: any;
        try {
            // Check if body is a JSON string containing our signal structure
            if (message.content && message.content.startsWith('{')) {
                signal = JSON.parse(message.content);
            }
        } catch { return; }

        // Must be a signal targeted at us
        if (!signal || !signal.type || signal.targetUserId !== currentUserId) return;

        try {
            switch (signal.type) {
                case 'offer':
                    // Verify we aren't already in a call
                    if (connectionState === 'idle') {
                        setIncomingCall({
                            callerId: signal.senderId,
                            callerName: signal.senderName,
                            offer: signal.payload
                        });
                    }
                    break;
                case 'answer':
                    if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
                        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.payload));
                    }
                    break;
                case 'ice-candidate':
                    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                        try {
                            await peerConnectionRef.current.addIceCandidate(signal.payload);
                        } catch (e) {
                            console.warn("Error adding ICE candidate", e);
                        }
                    }
                    break;
                case 'end-call':
                    cleanupCall();
                    break;
            }
        } catch (err) {
            console.error("Signal handling error:", err);
        }
    };

    return {
        initiateCall,
        acceptCall,
        rejectCall,
        endCall: () => {
            // Notify other peer we are ending
            if (incomingCall) rejectCall();
            // If we are in a call, we need to know who the other peer is to send 'end-call'
            // For simplicity, we just clean up locally and relies on connection state change source 
            // sending the signal is tricky without tracking the 'activePeerId'
            cleanupCall();
        },
        handleSignalMessage,
        incomingCall,
        callActive,
        connectionState,
        remoteStream
    };
};
