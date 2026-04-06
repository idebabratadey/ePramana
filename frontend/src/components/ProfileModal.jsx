import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail, Lock, ShieldCheck, User, ArrowRight, Edit2, Check, X, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast } from '../hooks/use-toast';

const ProfileModal = ({ open, onClose, currentEmail, fullName }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Name Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  // Email Flow States
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Deletion Flow States
  const [deleteConsent, setDeleteConsent] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    setEditNameValue(fullName || "");
  }, [fullName]);

  const resetModal = () => {
    setStep(1);
    setIsEditingName(false);
    setPassword("");
    setNewEmail("");
    setOtpCode("");
    setDeleteConsent(false);
    setDeletePassword("");
    onClose();
  };

  // --- NAME UPDATE ---
  const handleUpdateName = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: editNameValue });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Profile name updated!" });
        setIsEditingName(false);
        window.location.reload(); 
      }
    }
    setLoading(false);
  };

  // --- EMAIL FLOW LOGIC ---
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: currentEmail, password: password });
    setLoading(false);
    if (error) {
      toast({ title: "Authentication Failed", description: "Incorrect password.", variant: "destructive" });
    } else {
      setStep(3);
    }
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Code Sent!", description: `Verification code sent to ${newEmail}.` });
      setStep(4);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: newEmail, token: otpCode, type: 'email_change' });
    setLoading(false);
    if (error) {
      toast({ title: "Verification Failed", description: "Invalid code.", variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Email securely updated." });
      resetModal();
      window.location.reload(); 
    }
  };

  // --- ACCOUNT DELETION LOGIC ---
  const handleRequestDeletion = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Verify Password First (Enterprise Security Gate)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email: currentEmail, 
      password: deletePassword 
    });

    if (authError) {
      setLoading(false);
      toast({ title: "Authentication Failed", description: "Incorrect password. Deletion request aborted.", variant: "destructive" });
      return;
    }

    // 2. Submit the Request to the Backend via the deletion_requests table
    const { error: dbError } = await supabase
      .from('deletion_requests')
      .insert([{ user_id: authData.user.id, status: 'pending' }]);

    setLoading(false);

    if (dbError) {
      toast({ title: "Error", description: dbError.message, variant: "destructive" });
    } else {
      setStep(7); // Show Final Success Screen
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetModal()}>
      <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
        
        {/* STEP 1: Profile Details & Danger Zone */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2 dark:text-emerald-400">
                <User className="text-emerald-500" /> Account Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              
              <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg border dark:border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                  {!isEditingName && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingName(true)} className="h-6 px-2 text-emerald-600 dark:text-emerald-400">
                      <Edit2 size={14} className="mr-1" /> Edit
                    </Button>
                  )}
                </div>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <Input value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="h-8 dark:bg-gray-900" />
                    <Button size="sm" onClick={handleUpdateName} disabled={loading} className="h-8 bg-emerald-600 hover:bg-emerald-700"><Check size={16} /></Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsEditingName(false); setEditNameValue(fullName); }} className="h-8"><X size={16} /></Button>
                  </div>
                ) : (
                  <p className="font-semibold text-lg dark:text-gray-200">{fullName || "Not provided"}</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg border dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Email Address</p>
                <p className="font-semibold text-lg dark:text-gray-200">{currentEmail}</p>
              </div>
              
              <Button onClick={() => setStep(2)} className="w-full mt-2 flex gap-2">
                Change Email Address <ArrowRight size={16} />
              </Button>

              {/* DANGER ZONE */}
              <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-900/30">
                <h3 className="text-red-600 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} /> Danger Zone
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Permanently remove your personal data and delete your account. This action cannot be easily reversed.
                </p>
                <Button variant="destructive" onClick={() => setStep(5)} className="w-full bg-red-600 hover:bg-red-700 dark:shadow-neon-red flex gap-2">
                  <Trash2 size={16} /> Request Account Deletion
                </Button>
              </div>
            </div>
          </>
        )}

        {/* STEP 2, 3, 4 (Hidden for brevity, they remain exactly the same as the previous code) */}
        {step === 2 && ( /* ... Password for Email Change ... */ 
          <>
            <DialogHeader><DialogTitle className="text-2xl flex items-center gap-2 dark:text-emerald-400"><Lock className="text-emerald-500" /> Security Check</DialogTitle><DialogDescription>Verify your current password to change your email.</DialogDescription></DialogHeader>
            <form onSubmit={handleVerifyPassword} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Current Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="dark:bg-gray-950" /></div>
              <div className="flex gap-2"><Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>Cancel</Button><Button type="submit" className="w-full bg-emerald-600" disabled={loading}>{loading ? "Verifying..." : "Verify Identity"}</Button></div>
            </form>
          </>
        )}
        {step === 3 && ( /* ... New Email Input ... */ 
           <>
             <DialogHeader><DialogTitle className="text-2xl flex items-center gap-2 dark:text-emerald-400"><Mail className="text-emerald-500" /> New Email Address</DialogTitle><DialogDescription>We will send a 6-digit verification code to this new address.</DialogDescription></DialogHeader>
             <form onSubmit={handleRequestEmailChange} className="space-y-4 py-4">
               <div className="space-y-2"><Label>New Email Address</Label><Input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="dark:bg-gray-950" /></div>
               <Button type="submit" className="w-full bg-emerald-600" disabled={loading}>{loading ? "Sending Code..." : "Send Verification Code"}</Button>
             </form>
           </>
        )}
        {step === 4 && ( /* ... OTP Input ... */ 
           <>
             <DialogHeader><DialogTitle className="text-2xl flex items-center gap-2 dark:text-emerald-400"><ShieldCheck className="text-emerald-500" /> Enter Code</DialogTitle><DialogDescription>Please enter the 6-digit code sent to <span className="font-bold">{newEmail}</span></DialogDescription></DialogHeader>
             <form onSubmit={handleVerifyOtp} className="space-y-4 py-4">
               <div className="space-y-2"><Label>6-Digit Verification Code</Label><Input type="text" required maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="text-center text-2xl tracking-widest font-mono dark:bg-gray-950" /></div>
               <Button type="submit" className="w-full bg-emerald-600" disabled={loading}>{loading ? "Verifying..." : "Confirm & Update Email"}</Button>
             </form>
           </>
        )}

        {/* --- NEW DELETION STEPS --- */}

        {/* STEP 5: Deletion Warning & Terms */}
        {step === 5 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle /> Delete Account
              </DialogTitle>
              <DialogDescription className="text-gray-800 dark:text-gray-200 mt-4 text-base">
                You are about to submit a formal request to permanently delete your SmartSpend account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>All your financial records, categories, and settings will be permanently wiped.</li>
                <li>Your request will be manually reviewed by our engineering team to ensure security.</li>
                <li>You will receive a final confirmation email once the deletion is complete.</li>
                <li><strong>This action cannot be undone.</strong></li>
              </ul>
              
              <div className="flex items-start space-x-3 mt-6 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/50">
                <input 
                  type="checkbox" 
                  id="terms" 
                  className="mt-1 w-4 h-4 accent-red-600"
                  checked={deleteConsent}
                  onChange={(e) => setDeleteConsent(e.target.checked)}
                />
                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-200 cursor-pointer">
                  I understand that this is permanent and my data will never be restored.
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  disabled={!deleteConsent}
                  onClick={() => setStep(6)}
                >
                  Proceed
                </Button>
              </div>
            </div>
          </>
        )}

        {/* STEP 6: Deletion Password Verification */}
        {step === 6 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-600 dark:text-red-400 flex items-center gap-2">
                <Lock /> Final Security Check
              </DialogTitle>
              <DialogDescription>
                To prevent unauthorized deletion, please verify your password one last time.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRequestDeletion} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delete-password">Current Password</Label>
                <Input 
                  id="delete-password" type="password" required placeholder="••••••••"
                  value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                  className="dark:bg-gray-950 dark:border-gray-800 focus:border-red-500 focus:ring-red-500/50"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>Cancel</Button>
                <Button type="submit" variant="destructive" className="w-full bg-red-600 hover:bg-red-700 dark:shadow-neon-red" disabled={loading}>
                  {loading ? "Submitting Ticket..." : "Submit Deletion Request"}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* STEP 7: Deletion Success */}
        {step === 7 && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-2xl font-bold dark:text-gray-100">Request Submitted</DialogTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Your account deletion request has been safely sent to our engineering team. 
              We will process the data wipe and send a confirmation to <strong>{currentEmail}</strong> shortly.
            </p>
            <Button onClick={resetModal} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">
              Return to Dashboard
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;