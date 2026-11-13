import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Smartphone,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Modal, Button, Pill } from '../ui/index.js';

interface WhatsAppConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: { connected: boolean; phone?: string | null }) => void;
}

export const WhatsAppConnectModal: React.FC<WhatsAppConnectModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [phone, setPhone] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  // Polling while connecting with QR
  useEffect(() => {
    let interval: any;
    if (isOpen && status === 'connecting') {
      interval = setInterval(() => {
        checkStatus(true);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, status]);

  const checkStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res: any = await api.get('/whatsapp/status');
      if (res?.data) {
        setStatus(res.data.status);
        setPhone(res.data.phone || null);
        setName(res.data.name || null);
        if (res.data.qrCodeUrl) {
          setQrCodeUrl(res.data.qrCodeUrl);
        }
        if (onStatusChange) {
          onStatusChange({
            connected: res.data.status === 'connected',
            phone: res.data.phone || null,
          });
        }
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to check WhatsApp status');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStartConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      const res: any = await api.post('/whatsapp/connect', {});
      if (res?.data) {
        setStatus(res.data.status);
        setQrCodeUrl(res.data.qrCodeUrl || null);
        if (res.data.status === 'connected') {
          setPhone(res.data.phone);
          if (onStatusChange) onStatusChange({ connected: true, phone: res.data.phone });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize WhatsApp session');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await api.post('/whatsapp/disconnect', {});
      setStatus('disconnected');
      setPhone(null);
      setName(null);
      setQrCodeUrl(null);
      if (onStatusChange) onStatusChange({ connected: false, phone: null });
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link your WhatsApp device"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-btn border border-border bg-surface-2 text-xs text-tx flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-tx" />
            <span>{error}</span>
          </div>
        )}

        {/* ALREADY CONNECTED STATE */}
        {status === 'connected' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-surface-2 border border-border mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-tx" />
            </div>

            <div>
              <h3 className="serif text-lg font-bold text-tx">WhatsApp Device Linked</h3>
              <p className="mono text-xs text-tx font-semibold mt-1">
                +{phone} {name ? `(${name})` : ''}
              </p>
              <p className="text-xs text-tx-muted mt-2 max-w-sm mx-auto leading-relaxed">
                Your mobile WhatsApp is actively linked. Outgoing pitches will be sent from this number, and all client replies will ring directly on your phone!
              </p>
            </div>

            <div className="pt-4 border-t border-border flex justify-center gap-3">
              <Button
                variant="ghost"
                onClick={handleDisconnect}
                loading={disconnecting}
                size="sm"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                <span>Disconnect / Log out</span>
              </Button>
              <Button
                variant="primary"
                onClick={onClose}
                size="sm"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* CONNECTING / QR CODE SCAN STATE */}
        {status === 'connecting' && qrCodeUrl && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white rounded-card inline-block border border-border shadow-card mx-auto">
              <img
                src={qrCodeUrl}
                alt="Scan WhatsApp QR"
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>

            <div className="space-y-1">
              <span className="serif text-sm font-semibold text-tx block">
                Scan with your WhatsApp mobile app
              </span>
              <p className="text-xs text-tx-muted leading-relaxed max-w-sm mx-auto">
                Open WhatsApp on your phone ➔ Settings / Menu (⋮) ➔ <strong>Linked Devices</strong> ➔ <strong>Link a Device</strong> and point your camera here.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-tx-subtle mono animate-pulse pt-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Waiting for scan... auto-detecting</span>
            </div>

            <div className="pt-3 border-t border-border flex justify-between items-center">
              <button
                type="button"
                onClick={handleStartConnect}
                disabled={loading}
                className="text-xs text-tx-muted hover:text-tx inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reload QR</span>
              </button>
              <Button variant="ghost" onClick={onClose} size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* DISCONNECTED INITIAL STATE */}
        {status === 'disconnected' && (
          <div className="space-y-5 py-2">
            <div className="flex items-start gap-3 p-3.5 bg-surface-2 rounded-card border border-border">
              <Smartphone className="w-5 h-5 text-tx mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-tx block">How it works:</span>
                <p className="text-tx-muted leading-relaxed">
                  1. Link your personal or business WhatsApp by scanning a QR code once.
                  <br />
                  2. Your mobile phone WhatsApp keeps working normally 100%.
                  <br />
                  3. Select leads in CRM and send bulk broadcasts in 1 click.
                  <br />
                  4. When leads reply, they ring straight on your phone!
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleStartConnect}
                loading={loading}
                size="sm"
              >
                <QrCode className="w-3.5 h-3.5 mr-1.5" />
                <span>Generate QR Code</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
