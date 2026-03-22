const fs = require('fs');

let file1 = "src/app/api/auth/fathom/login/route.ts";
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(
  "const state = user.id;",
  "const returnTo = request.nextUrl.searchParams.get('returnTo');\n  const state = returnTo ? `${user.id}::${returnTo}` : user.id;"
);
fs.writeFileSync(file1, content1);

let file2 = "src/app/api/auth/fathom/callback/route.ts";
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(
  "const state = request.nextUrl.searchParams.get(\"state\"); // This is user.id from login",
  "const stateParam = request.nextUrl.searchParams.get(\"state\") || \"\";\n  const [state, returnTo] = stateParam.includes('::') ? stateParam.split('::') : [stateParam, null];\n"
);
content2 = content2.replace(
  "return NextResponse.redirect(new URL(\"/dashboard/settings?success=fathom_connected\", request.url));",
  "if (returnTo) {\n      return NextResponse.redirect(new URL(returnTo, request.url));\n    }\n    return NextResponse.redirect(new URL(\"/dashboard/settings?success=fathom_connected\", request.url));"
);
fs.writeFileSync(file2, content2);
