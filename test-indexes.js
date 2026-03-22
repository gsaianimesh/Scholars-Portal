const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

const oldHeaderStart = '<div className="flex items-center gap-4">';
const oldHeaderEndBytesString = `        </div>
      </div>

      {/* Reschedule Dialog */}`;
const startIdx = code.indexOf(oldHeaderStart);
const endIdx = code.indexOf(oldHeaderEndBytesString, startIdx);
console.log('Header Indices:', startIdx, endIdx);

const preMeetingStartStr = `{!isPast && preMeetingContext && (`;
const preMeetingEndStr = `          </CardContent>
        </Card>
      )}`;
const pmStartIdx = code.indexOf(preMeetingStartStr);
const pmEndIdx = code.indexOf(preMeetingEndStr, pmStartIdx);
console.log('Briefing Indices:', pmStartIdx, pmEndIdx);

