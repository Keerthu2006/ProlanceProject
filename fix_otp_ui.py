import re

with open('frontend/src/pages/auth/AuthPages.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert handleOtpChange and handleOtpKeyDown right before handleVerifyOtp
otp_funcs = '''  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value !== '' && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otpDigits[index] === '' && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async () => {'''

content = content.replace('  const handleVerifyOtp = async () => {', otp_funcs)

# 2. Update the TextField sx and inputProps
old_textfield = '''                    {[0,1,2,3,4,5].map(i => (
                      <TextField
                        key={i}
                        inputRef={el => otpRefs.current[i] = el}
                        value={otpDigits[i]}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#FFDBBB' }}}
                        sx={{
                          width: 48,
                          '& .MuiOutlinedInput-root': {
                            borderColor: 'rgba(153,126,103,0.4)',
                            '&.Mui-focused fieldset': { borderColor: '#997E67' }
                          }
                        }}
                      />
                    ))}'''

new_textfield = '''                    {[0,1,2,3,4,5].map(i => (
                      <TextField
                        key={i}
                        inputRef={el => otpRefs.current[i] = el}
                        value={otpDigits[i]}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: 28, fontWeight: 'bold', color: '#FFDBBB' }}}
                        sx={{
                          width: 54,
                          backgroundColor: 'rgba(255, 219, 187, 0.05)',
                          borderRadius: '8px',
                          '& .MuiInputBase-input': { color: '#FFDBBB', caretColor: '#FFDBBB' },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'rgba(153,126,103,0.3)', borderWidth: '2px' },
                            '&:hover fieldset': { borderColor: 'rgba(153,126,103,0.7)' },
                            '&.Mui-focused fieldset': { borderColor: '#FFDBBB', borderWidth: '2px' }
                          }
                        }}
                      />
                    ))}'''

content = content.replace(old_textfield, new_textfield)

with open('frontend/src/pages/auth/AuthPages.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
