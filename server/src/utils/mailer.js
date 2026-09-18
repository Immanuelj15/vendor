export const sendEmail = async ({ to, subject, text, html }) => {
  console.log('\n=============================================');
  console.log('📧 [MOCK MAILER] Email Dispatch Initiated');
  console.log(`To      : ${to}`);
  console.log(`Subject : ${subject}`);
  console.log('---------------------------------------------');
  if (text) console.log(text);
  if (html) console.log('[HTML Content]: ', html);
  console.log('=============================================\n');
  
  // In production, integrate with SendGrid, SES, Nodemailer, etc.
  return true;
};
