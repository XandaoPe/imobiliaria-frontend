import React, { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';

// Função de som com frequências diferentes para distinguir
const playAlertSound = (type: 'NEW' | 'PENDING') => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Som Agudo para Novo Lead, Som Médio para Leads Pendentes
    osc.frequency.setValueAtTime(type === 'NEW' ? 392 : 440, audioCtx.currentTime);
    osc.type = type === 'NEW' ? 'triangle' : 'square';

    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
};

export const NotificationBadge: React.FC = () => {
    const { user } = useAuth();
    const lastCount = useRef<number>(0);
    const hasAlertedLogin = useRef<boolean>(false);

    const checkLeads = useCallback(async (isPolling: boolean) => {
        if (!user?.token) return;

        try {
            const response = await axios.get(API_URL+'/leads', {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const leads = response.data;
            const currentCount = leads.length;
            const hasPending = leads.some((l: any) => l.status !== 'CONCLUIDO');

            // 1. Alerta ao Logar (assim que o componente monta e o user existe)
            if (!isPolling && !hasAlertedLogin.current && hasPending) {
                playAlertSound('PENDING');
                hasAlertedLogin.current = true;
            }

            // 2. Alerta de Novo Lead (durante o uso do sistema)
            if (isPolling && currentCount > lastCount.current) {
                playAlertSound('NEW');
            }

            lastCount.current = currentCount;

            // Dispara evento para atualizar contadores em outros componentes (opcional)
            window.dispatchEvent(new CustomEvent('updateLeadsCount', { detail: currentCount }));

        } catch (error) {
            console.error("Erro no monitor de leads:", error);
        }
    }, [user]);

    useEffect(() => {
        // Roda imediatamente ao logar
        if (user) {
            checkLeads(false);

            // Configura o Polling global (ex: a cada 60 segundos)
            const interval = setInterval(() => checkLeads(true), 60000);
            return () => clearInterval(interval);
        }
    }, [user, checkLeads]);

    useEffect(() => {
        // Configurar listener para notificações de agenda
        const handleAgendaNotification = async () => {
            // Atualiza o contador de agendamentos
            window.dispatchEvent(new CustomEvent('updateAgenda'));

            // Toca som de notificação
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Som diferente do lead
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
        };

        // Ouvir evento global de atualização de agenda
        window.addEventListener('agendaNotification', handleAgendaNotification);

        return () => {
            window.removeEventListener('agendaNotification', handleAgendaNotification);
        };
    }, []);

    return null; // Este componente não precisa renderizar nada, apenas processar o som
};