const fs = require('fs');
let code = fs.readFileSync('src/app/api/meetings/[id]/transcript/route.ts', 'utf8');

const regex = /      let scholarsData = \[\];\n      if \(userIds\.length > 0\) \{\n        const \{ data: schData \} = await serviceClient\n          \.from\("scholars"\)\n          \.select\("id, user_id, users\(name\)"\)\n          \.in\("user_id", userIds\);\n        scholarsData = schData \|\| \[\];\n      \}/;

const newBlock = `      let scholarsData: any[] = [];
      if (userIds.length > 0) {
        const { data: schData } = await serviceClient
          .from("scholars")
          .select("id, user_id, users(name)")
          .in("user_id", userIds);
        scholarsData = schData || [];
      } else {
        // Fallback: get all scholars for this professor if no participants mapped yet
        const { data: allScholars } = await serviceClient
          .from("scholars")
          .select("id, user_id, users(name)")
          .eq("professor_id", meeting.professor_id);
        scholarsData = allScholars || [];
      }`;

const finalCode = code.replace(regex, newBlock);
fs.writeFileSync('src/app/api/meetings/[id]/transcript/route.ts', finalCode);
console.log("Updated transcript route.");
