import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Header from '@/components/Header';

export default function ShareForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const formUrl = `${window.location.origin}/f/${id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success('Link copied');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Fill out this form', url: formUrl });
      } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  };

  const shareWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(`Fill out this form: ${formUrl}`)}`, '_blank');
  const shareFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(formUrl)}`, '_blank');
  const shareTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(formUrl)}&text=${encodeURIComponent('Fill out this form')}`,
      '_blank'
    );

  return (
    <div className="min-h-screen">
      <Header
        left={
          <>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="mono-label text-muted-foreground">Share Form</span>
          </>
        }
      />

      <main className="container mx-auto px-4 py-12 max-w-lg">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold mb-12">Share</h1>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="mono-card flex items-center justify-center p-8 bg-foreground">
              <QRCodeSVG value={formUrl} size={200} bgColor="#000000" fgColor="#ffffff" />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <p className="mono-label text-muted-foreground mb-2">Form Link</p>
                <div className="flex">
                  <input value={formUrl} readOnly className="mono-input flex-1 text-sm py-3 px-3" />
                  <button onClick={copyLink} className="mono-btn-primary py-3 px-4">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="mono-label text-muted-foreground mb-2">Share via</p>
                <button onClick={shareWhatsApp} className="mono-btn-secondary w-full text-sm py-3">
                  WhatsApp
                </button>
                <button onClick={shareFacebook} className="mono-btn-secondary w-full text-sm py-3">
                  Facebook
                </button>
                <button onClick={shareTwitter} className="mono-btn-secondary w-full text-sm py-3">
                  X / Twitter
                </button>
                <button
                  onClick={handleShare}
                  className="mono-btn-primary w-full text-sm py-3 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}