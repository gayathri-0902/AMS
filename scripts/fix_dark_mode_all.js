const fs = require('fs');
const path = require('path');

const directory = '/home/apurva/Downloads/AMS/src/components';
const filesToProcess = [
  'StudentDashboard.jsx',
  'ParentDashboard.jsx',
  'AdminDash2.jsx',
  'SubjectDetails.jsx',
  'AssignmentHub.jsx',
  'HandIn.jsx',
  'AssignmentGrader.jsx',
  'FeedbackPage.jsx',
  'AcademicAI.jsx'
];

const replacements = [
  { search: /bg-\[\#f0f2f5\]/g, replace: 'bg-[#f0f2f5] dark:bg-slate-900' },
  { search: /bg-white/g, replace: 'bg-white dark:bg-slate-800' },
  { search: /text-gray-800/g, replace: 'text-gray-800 dark:text-white' },
  { search: /text-gray-900/g, replace: 'text-gray-900 dark:text-white' },
  { search: /text-gray-700/g, replace: 'text-gray-700 dark:text-slate-200' },
  { search: /text-gray-600/g, replace: 'text-gray-600 dark:text-slate-300' },
  { search: /text-gray-500/g, replace: 'text-gray-500 dark:text-slate-400' },
  { search: /text-gray-400/g, replace: 'text-gray-400 dark:text-slate-500' },
  { search: /text-slate-800/g, replace: 'text-slate-800 dark:text-white' },
  { search: /text-slate-700/g, replace: 'text-slate-700 dark:text-slate-200' },
  { search: /text-slate-600/g, replace: 'text-slate-600 dark:text-slate-300' },
  { search: /text-slate-500/g, replace: 'text-slate-500 dark:text-slate-400' },
  { search: /text-slate-400/g, replace: 'text-slate-400 dark:text-slate-500' },
  { search: /bg-gray-50/g, replace: 'bg-gray-50 dark:bg-slate-700' },
  { search: /bg-slate-50/g, replace: 'bg-slate-50 dark:bg-slate-700' },
  { search: /bg-slate-100/g, replace: 'bg-slate-100 dark:bg-slate-700' },
  { search: /bg-slate-200/g, replace: 'bg-slate-200 dark:bg-slate-700' },
  { search: /border-gray-100/g, replace: 'border-gray-100 dark:border-slate-600' },
  { search: /border-gray-200/g, replace: 'border-gray-200 dark:border-slate-600' },
  { search: /border-gray-300/g, replace: 'border-gray-300 dark:border-slate-500' },
  { search: /border-gray-50/g, replace: 'border-gray-50 dark:border-slate-700' },
  
  // Blue accents
  { search: /bg-blue-50(?![0-9])/g, replace: 'bg-blue-50 dark:bg-blue-900/40' },
  { search: /bg-blue-100/g, replace: 'bg-blue-100 dark:bg-blue-900/60' },
  { search: /border-blue-50(?![0-9])/g, replace: 'border-blue-50 dark:border-blue-900/50' },
  { search: /border-blue-100/g, replace: 'border-blue-100 dark:border-blue-800' },
  { search: /border-blue-200/g, replace: 'border-blue-200 dark:border-blue-700' },
  { search: /hover:border-blue-200/g, replace: 'hover:border-blue-200 dark:hover:border-blue-600' },
  { search: /hover:bg-blue-50(?![0-9])/g, replace: 'hover:bg-blue-50 dark:hover:bg-blue-900/50' },
  { search: /hover:bg-blue-100/g, replace: 'hover:bg-blue-100 dark:hover:bg-blue-800/80' },
  { search: /text-blue-500/g, replace: 'text-blue-500 dark:text-blue-400' },
  { search: /text-blue-600/g, replace: 'text-blue-600 dark:text-blue-400' },
  
  // Purple accents
  { search: /bg-purple-50(?![0-9])/g, replace: 'bg-purple-50 dark:bg-purple-900/30' },
  { search: /border-purple-100/g, replace: 'border-purple-100 dark:border-purple-800' },
  { search: /text-purple-600/g, replace: 'text-purple-600 dark:text-purple-400' },
  { search: /text-purple-400/g, replace: 'text-purple-400 dark:text-purple-300' },
  { search: /text-purple-300/g, replace: 'text-purple-300 dark:text-purple-400' },
  
  // Red accents
  { search: /bg-red-50(?![0-9])/g, replace: 'bg-red-50 dark:bg-red-900/30' },
  { search: /border-red-50(?![0-9])/g, replace: 'border-red-50 dark:border-red-900/50' },
  
  // Green accents
  { search: /bg-green-100/g, replace: 'bg-green-100 dark:bg-green-900/40' },
  { search: /bg-green-50/g, replace: 'bg-green-50 dark:bg-green-900/20' },
  { search: /text-green-700/g, replace: 'text-green-700 dark:text-green-400' },
  { search: /text-green-600/g, replace: 'text-green-600 dark:text-green-400' },
];

filesToProcess.forEach(fileName => {
  const filePath = path.join(directory, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${fileName}: file not found.`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });

  // Since some replacements might get applied multiple times accidentally if we run it twice, we check for 'dark:bg-slate-900 dark:bg-slate-900' and fix
  content = content.replace(/dark:([a-z0-9\-\/]+)\s+dark:\1/g, 'dark:$1');
  
  // A second pass for any other duplicate dark classes like text-white dark:text-white dark:text-white
  content = content.replace(/(dark:[a-z0-9\-\/]+)\s+\1/g, '$1');

  fs.writeFileSync(filePath, content);
  console.log(`Successfully processed ${fileName}`);
});
