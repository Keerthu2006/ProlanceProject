import re

with open('frontend/src/pages/auth/AuthPages.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the TextField block dynamically
pattern = r'<TextField.*?key=\{i\}.*?sx=\{\{.*?\}\}\s*/>'

new_textfield = '''<TextField
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
                      />'''

content = re.sub(pattern, new_textfield, content, flags=re.DOTALL)

with open('frontend/src/pages/auth/AuthPages.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
