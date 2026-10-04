import re

with open('frontend/src/pages/auth/AuthPages.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement_verify = '''  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/auth/verify-otp', {
        email: formData.email,
        otp: otpDigits.join('')
      });
      
      // OTP is valid! Now actually create the account.
      const res = await axios.post('http://localhost:8080/api/auth/register', pendingLogin);
      
      const userRole = res.data?.user?.role || res.data?.role || pendingLogin.role;
      const actualFullName = res.data?.user?.fullName || pendingLogin.fullName;
      
      login(res.data?.accessToken, { email: formData.email, role: userRole, fullName: actualFullName });
      
      toast.dismiss('otp-toast');
      toast.success('Email verified! Account created.');
      
      if (userRole === 'ROLE_FREELANCER') navigate('/onboarding');
      else navigate('/dashboard/client');
      
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error === 'Invalid or expired OTP') {
        toast.error('Wrong code. Please try again.');
      } else {
        toast.error('Failed to create account. Email may already be in use.');
      }
    } finally { setLoading(false); }
  };'''

# Replace handleVerifyOtp
pattern = r'const handleVerifyOtp = async \(\) => \{.*?finally \{ setLoading\(false\); \}\s*\};'
content = re.sub(pattern, replacement_verify, content, flags=re.DOTALL)

with open('frontend/src/pages/auth/AuthPages.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
