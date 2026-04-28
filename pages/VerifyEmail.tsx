import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Button from '../components/Button';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('No verification token provided.');
        return;
      }

      try {
        console.log('[VERIFY] Attempting to verify token:', token?.substring(0, 8) + '...');
        await verifyEmail(token);
        console.log('[VERIFY] Verification successful');
        setStatus('success');
      } catch (error: any) {
        console.error('[VERIFY] Verification failed:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to verify email.');
      }
    };

    performVerification();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900">Verifying your email...</h2>
            <p className="text-slate-500">Please wait while we confirm your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
              <p className="text-slate-500">Your account is now fully activated. You can now report and claim items.</p>
            </div>
            <Button onClick={() => navigate('/dashboard')} className="w-full py-3">
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
              <p className="text-red-500 font-medium">{errorMessage}</p>
              <p className="text-slate-500 text-sm">The link may be invalid or expired. Please try signing up again or contact support.</p>
            </div>
            <div className="pt-4 space-y-3">
              <Link to="/signup">
                <Button variant="secondary" className="w-full py-3">
                  Back to Signup
                </Button>
              </Link>
              <Link to="/" className="block text-sm text-blue-600 hover:underline">
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
