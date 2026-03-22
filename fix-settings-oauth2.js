const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const searchParamsAdd = `
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'fathom_connected') {
        setMessage('Fathom account successfully connected!');
      } else if (urlParams.get('error')) {
        setMessage('Failed to connect Fathom: ' + urlParams.get('error'));
      }
    }
  }, []);
`;
code = code.replace(/  useEffect\(\(\) => \{\n    loadProfile\(\);\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n  \}, \[\]\);/, "  useEffect(() => {\n    loadProfile();\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n" + searchParamsAdd);

fs.writeFileSync('src/app/dashboard/settings/page.tsx', code);
