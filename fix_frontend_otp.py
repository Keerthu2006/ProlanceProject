import re

with open('frontend/src/pages/auth/AuthPages.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''      if (!isLogin) {
        // Registration flow - request OTP first
        if (!formData.email || !formData.password) {
          toast.error('Please fill in all fields.'); setLoading(false); return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords don't match"); setLoading(false); return;
        }
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters.'); setLoading(false); return;
        }
        
        try {
          await axios.post('http://localhost:8080/api/auth/send-otp', { email: formData.email });
          setPendingLogin({
            fullName: formData.fullName || formData.email.split('@')[0],
            email: formData.email,
            password: formData.password,
            role: formData.role,
            username: formData.email.split('@')[0] + Math.floor(Math.random() * 1000)
          });
          setShowOtpScreen(true);
          toast.success('Verification code sent to your email!');
        } catch (err) {
          toast.error('Failed to send verification code. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Login flow
      try {
        if (!formData.email || !formData.password) {
          toast.error('Please fill in all fields.'); setLoading(false); return;
        }
        const payload = { email: formData.email, password: formData.password, role: formData.role };
        const res = await axios.post('http://localhost:8080/api/auth/login', payload);

        const userRole = res.data?.user?.role || res.data?.role || formData.role;
        const actualFullName = res.data?.user?.fullName || formData.fullName || formData.email?.split('@')[0];
        
        login(res.data?.accessToken, { email: formData.email, role: userRole, fullName: actualFullName });
        toast.success('Welcome back to ProLance!');
        
        if (userRole === 'ROLE_FREELANCER') navigate('/dashboard/freelancer');
        else navigate('/dashboard/client');

      } catch (err) {
        const data = err.response?.data;
        if (err.response?.status === 401) {
          toast.error('Invalid credentials. Please try again.');
        } else {
          toast.error(data?.message || 'Login failed. Please try again.');
        }
      }
      setLoading(false);
'''

# Replace the body of handleSubmit
pattern = r'const endpoint = isLogin.*?setLoading\(false\);\s*\}'
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('frontend/src/pages/auth/AuthPages.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
