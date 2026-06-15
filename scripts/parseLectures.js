const fs = require('fs');
const path = require('path');

const lecsBase = path.join(__dirname, '..', 'lecs', 'levels');
const publicBase = '/lecs/levels';

// Helper to find files case-insensitively
function findContentFile(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  const files = fs.readdirSync(dirPath);
  const found = files.find(f => f.toLowerCase() === 'content.txt');
  return found ? path.join(dirPath, found) : null;
}

// Clean and normalize text lines
function parseContent(filePath, relativeImageFolder, imagesList) {
  if (!filePath || !fs.existsSync(filePath)) {
    return '<p class="text-slate-500 italic">No content available yet.</p>';
  }

  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/);
  
  let html = '';
  let currentSection = {
    title: '',
    content: [],
  };
  
  const sections = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line is a header
    if (line.startsWith('##') || line.startsWith('###') || (i === 0 && line.toLowerCase().includes('level'))) {
      if (currentSection.title || currentSection.content.length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = {
        title: line.replace(/^#+\s*/, '').replace(/:$/, '').trim(),
        content: [],
      };
    } else {
      currentSection.content.push(line);
    }
  }
  
  if (currentSection.title || currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  // If no sections were found (no ## headers), treat the whole thing as one section
  if (sections.length === 0 && lines.length > 0) {
    sections.push({
      title: 'Introduction',
      content: lines.map(l => l.trim()).filter(Boolean)
    });
  }

  // Format sections into premium HTML
  sections.forEach((sec, secIdx) => {
    // Skip general level title sections if they contain nothing else
    if (sec.title.toLowerCase().includes('level') && sec.content.length === 0) {
      return;
    }

    const title = sec.title;
    let secContentHtml = '';
    
    // Group paragraphs and list items
    let inList = false;
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        secContentHtml += '<ul class="space-y-2 mb-4 pl-1">';
        listItems.forEach(item => {
          // Add clean Pill bullet point styling
          secContentHtml += `
            <li class="flex items-start gap-2.5 text-slate-600 text-sm">
              <span class="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-cyan-500 shadow-sm shadow-cyan-300"></span>
              <span class="flex-1">${item}</span>
            </li>
          `;
        });
        secContentHtml += '</ul>';
        listItems = [];
        inList = false;
      }
    };

    sec.content.forEach(pLine => {
      // Clean up common bullet points
      const cleanLine = pLine.replace(/^[-*•]\s*/, '').trim();
      
      // Determine if it is a list item or a standard paragraph
      // A list item is relatively short or starts with a dash/bullet, or the section has many short consecutive lines
      const isBullet = pLine.startsWith('-') || pLine.startsWith('*') || pLine.startsWith('•');
      const isShort = cleanLine.length < 120 && !cleanLine.endsWith('.') && !cleanLine.endsWith('?') && !cleanLine.endsWith(':');

      if (isBullet || isShort) {
        inList = true;
        listItems.push(cleanLine);
      } else {
        flushList();
        
        // Emojis and keywords highlighting
        let processedLine = cleanLine
          .replace(/(ESP32|microcontroller|pins?|delay|HIGH|LOW|Serial|Serial Monitor|variables?|inputs?|outputs?|Setup|Loop|for loop|while loop)/gi, '<strong>$1</strong>');

        // Check if it is a callout / note
        if (cleanLine.toLowerCase().startsWith('key insight') || cleanLine.toLowerCase().startsWith('remember') || cleanLine.toLowerCase().startsWith('note:') || cleanLine.toLowerCase().startsWith('warning:')) {
          secContentHtml += `
            <div class="my-4 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-900 shadow-sm">
              <span class="text-lg flex-shrink-0">💡</span>
              <div class="flex-1 leading-relaxed">${processedLine}</div>
            </div>
          `;
        } else {
          secContentHtml += `<p class="mb-3 leading-relaxed text-slate-600 text-sm">${processedLine}</p>`;
        }
      }
    });
    
    flushList();

    // Find a matching image for this section
    let matchedImage = null;

    if (imagesList && imagesList.length > 0) {
      // 1. Try to find image matching the title
      const titleSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      matchedImage = imagesList.find(img => {
        const imgName = path.basename(img, path.extname(img)).toLowerCase().replace(/[^a-z0-9]/g, '');
        return imgName.includes(titleSlug) || titleSlug.includes(imgName);
      });

      // 2. If no title slug match, and it's a "misc" style, use matching index
      if (!matchedImage) {
        const miscMatch = imagesList.find(img => {
          const name = path.basename(img).toLowerCase();
          return name.startsWith('misc_') && name.includes(`_${secIdx}`);
        });
        if (miscMatch) matchedImage = miscMatch;
      }
      
      // 3. Fallback to indexing
      if (!matchedImage) {
        // If image count matches section count or we have a specific index
        const indexMatch = imagesList.find(img => {
          const name = path.basename(img, path.extname(img));
          const numMatch = name.match(/\d+$/);
          return numMatch && parseInt(numMatch[0]) === secIdx;
        });
        if (indexMatch) matchedImage = indexMatch;
      }
    }

    let imgHtml = '';
    if (matchedImage) {
      const imgWebPath = `${relativeImageFolder}/images/${path.basename(matchedImage)}`;
      imgHtml = `
        <div class="my-5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-w-xl mx-auto bg-slate-50 transition-transform hover:scale-[1.01]">
          <img src="${imgWebPath}" alt="${title}" class="w-full object-contain max-h-80" />
        </div>
      `;
    }

    // Build the section card HTML
    html += `
      <div class="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 class="text-base font-bold text-slate-800 mb-3.5 flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-300"></span>
          ${title}
        </h3>
        <div class="text-slate-600 space-y-2 bg-full[#e6e6d6]">
          ${secContentHtml}
        </div>
        ${imgHtml}
      </div>
    `;
  });

  return html;
}

function processLevels() {
  const lectures = {};

  const levelKeys = [
    {
      levelId: 1,
      lessons: [
        { lessonId: '1-1', folders: { intro: 'Level 1/Level 1.1/LEVEL 1.1 Introduction', concept: 'Level 1/Level 1.1/LEVEL 1.1 Concept Building' } },
        { lessonId: '1-2', folders: { intro: 'Level 1/Level 1.2/Introduction', concept: 'Level 1/Level 1.2/Concept Building' } },
        { lessonId: '1-3', folders: { intro: 'Level 1/Level 1.3/Introduction', concept: 'Level 1/Level 1.3/Concept Building' } },
        { lessonId: '1-4', folders: { intro: 'Level 1/Level 1.4/Introduction', concept: 'Level 1/Level 1.4/Concept Building' } }
      ]
    },
    {
      levelId: 2,
      lessons: [
        { lessonId: '2-1', folders: { intro: 'Level 2/2.1/Introduction', concept: 'Level 2/2.1/Concept Building' } },
        { lessonId: '2-2', folders: { intro: 'Level 2/4.3/Introduction', concept: 'Level 2/4.3/Concept Building' } },
        { lessonId: '2-3', folders: { intro: 'Level 2/2.2/Introduction', concept: 'Level 2/2.2/Concept Building' } }, // Note: We will handle additional input content elegantly
        { lessonId: '2-4', folders: { intro: 'Level 2/2.4/Introduction', concept: 'Level 2/2.4/Concept Building' } }
      ]
    },
    {
      levelId: 3,
      lessons: [
        { lessonId: '3-1', folders: { intro: 'Level 3/Level 3.1/Introduction', concept: 'Level 3/Level 3.1/Concept Building' } },
        { lessonId: '3-2', folders: { intro: 'Level 3/Level 3.2/Introduction', concept: 'Level 3/Level 3.2/Concept Building' } },
        { lessonId: '3-3', folders: { intro: 'Level 3/Level 3.3/Introduction', concept: 'Level 3/Level 3.3/Concept Building' } },
        { lessonId: '3-4', folders: { intro: 'Level 3/Level 3.4/Introduction', concept: 'Level 3/Level 3.4/Concept Building' } }
      ]
    },
    {
      levelId: 4,
      lessons: [
        { lessonId: '4-1', folders: { intro: 'Level 4/4.1/Introduction', concept: 'Level 4/4.1/Concept Building' } },
        { lessonId: '4-2', folders: { intro: 'Level 4/4.2/Introduction', concept: 'Level 4/4.2/Concept Building' } },
        { lessonId: '4-3', folders: { intro: 'Level 4/4.4/Introduction', concept: 'Level 4/4.4/Concept Building' } },
        { lessonId: '4-4', folders: { intro: 'Level 4/4.5/Introduction', concept: 'Level 4/4.5/Concept Building' } }
      ]
    }
  ];

  levelKeys.forEach(lvl => {
    lvl.lessons.forEach(les => {
      const keyPrefix = `${lvl.levelId}-${les.lessonId}`;
      lectures[keyPrefix] = {};

      Object.entries(les.folders).forEach(([stepType, folderRelPath]) => {
        const fullFolder = path.join(lecsBase, folderRelPath);
        const contentPath = findContentFile(fullFolder);
        const imagesDir = path.join(fullFolder, 'images');
        
        let imagesList = [];
        if (fs.existsSync(imagesDir)) {
          imagesList = fs.readdirSync(imagesDir).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
        }

        const relativeImageFolder = `${publicBase}/${folderRelPath}`;
        let html = parseContent(contentPath, relativeImageFolder, imagesList);

        // If we are on lesson 2-3 concept building, let's append Level 2.3 content too!
        if (keyPrefix === '2-2-3' && stepType === 'concept') {
          const extraFolder = path.join(lecsBase, 'Level 2/2.3/Concept Building');
          const extraContentPath = findContentFile(extraFolder);
          const extraImagesDir = path.join(extraFolder, 'images');
          let extraImages = [];
          if (fs.existsSync(extraImagesDir)) {
            extraImages = fs.readdirSync(extraImagesDir).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
          }
          const extraHtml = parseContent(extraContentPath, `${publicBase}/Level 2/2.3/Concept Building`, extraImages);
          html += '<div class="border-t border-slate-100 my-8 pt-6"></div>' + extraHtml;
        }

        // Same for lesson 2-3 introduction
        if (keyPrefix === '2-2-3' && stepType === 'intro') {
          const extraFolder = path.join(lecsBase, 'Level 2/2.3/Introduction');
          const extraContentPath = findContentFile(extraFolder);
          const extraImagesDir = path.join(extraFolder, 'images');
          let extraImages = [];
          if (fs.existsSync(extraImagesDir)) {
            extraImages = fs.readdirSync(extraImagesDir).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
          }
          const extraHtml = parseContent(extraContentPath, `${publicBase}/Level 2/2.3/Introduction`, extraImages);
          html += '<div class="border-t border-slate-100 my-8 pt-6"></div>' + extraHtml;
        }

        lectures[`${keyPrefix}-${stepType}`] = html;
      });
    });
  });

  // Write out a beautiful TypeScript structure
  const tsContent = `// This file is auto-generated by parseLectures.js. Do not edit directly.
export const LECTURES_DATA: Record<string, string> = ${JSON.stringify(lectures, null, 2)};
`;

  const outputPath = path.join(__dirname, '..', 'src', 'lib', 'lecturesData.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
}

processLevels();
