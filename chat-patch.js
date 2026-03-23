const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/chat/page.tsx', 'utf-8');

if (!code.includes('unreadCounts')) {
  code = code.replace(
    /const \[messages, setMessages\] = useState<any\[\]>\(\[\]\);/,
    `const [messages, setMessages] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});`
  );

  code = code.replace(
    /setContacts\(allContacts\);/,
    `setContacts(allContacts);
    
    // Fetch unread messages for all contacts
    const { data: unreadMsgs } = await supabase
      .from('activity_logs')
      .select('user_id')
      .eq('activity_type', 'direct_message')
      .eq('metadata->>receiver_id', dbUser.id)
      .eq('metadata->>read', 'false');

    if (unreadMsgs) {
      const counts: Record<string, number> = {};
      unreadMsgs.forEach(msg => {
        counts[msg.user_id] = (counts[msg.user_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }`
  );

  // When a chat is opened, mark messages as read
  code = code.replace(
    /setMessages\(filteredMsgs\);\n     }/,
    `setMessages(filteredMsgs);
     }

     // Mark messages as read
     if (activeContact.id !== 'lumi-ai') {
        const { data: unreadMe } = await supabase
          .from('activity_logs')
          .select('id')
          .eq('activity_type', 'direct_message')
          .eq('user_id', activeContact.id)
          .eq('metadata->>receiver_id', currentUser.id)
          .eq('metadata->>read', 'false');

        if (unreadMe && unreadMe.length > 0) {
          const ids = unreadMe.map(m => m.id);
          // Wait, supabase update over multiple items requires .in('id', ids)
          await supabase.from('activity_logs')
            .update({ metadata: { receiver_id: currentUser.id, read: true } })
            .in('id', ids);
            
          setUnreadCounts(prev => ({...prev, [activeContact.id]: 0}));
        }
     }`
  );

  // When sending a message, write read: false
  code = code.replace(
    /metadata: \{ receiver_id: activeContact\.id \}/,
    `metadata: { receiver_id: activeContact.id, read: false }`
  );

  // In the UI, add the badge next to the contact name
  code = code.replace(
    /<span className="font-medium">\{contact\.id === 'lumi-ai' \? contact\.name : contact\.name\}<\/span>/,
    `<div className="flex items-center justify-between w-full">
                          <span className="font-medium truncate">{contact.id === 'lumi-ai' ? contact.name : contact.name}</span>
                          {unreadCounts[contact.id] > 0 && contact.id !== activeContact?.id && (
                            <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {unreadCounts[contact.id]}
                            </span>
                          )}
                        </div>`
  );

  fs.writeFileSync('src/app/dashboard/chat/page.tsx', code);
  console.log("Patched chat/page.tsx");
}
