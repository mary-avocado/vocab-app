import mustache from "https://raw.githubusercontent.com/janl/mustache.js/65af14d1e01c74fc94337b9241909d7c153f5cfc/mustache.mjs"

const outDir = 'out';
const dataDir = 'data/deutsch';
const templatesDir = 'src/templates';

Deno.removeSync(outDir, { recursive: true });
Deno.mkdirSync(outDir);

const indexTemplateContents = Deno.readTextFileSync(templatesDir + '/index.html');
const infoTemplateContents = Deno.readTextFileSync(templatesDir + '/info.html');
const inputTemplateContents = Deno.readTextFileSync(templatesDir + '/input.html');

const lessons = JSON.parse(Deno.readTextFileSync(dataDir + '/lessons.json'));

function link_info(k) {
  return 'info' + k.toString() + '.html';
}

function link_input(k) {
  return 'input' + k.toString() + '.html';
}

for (let lesson_i = 0; lesson_i < lessons.length; lesson_i++) {
  const lesson = lessons[lesson_i];
  const lessonDataFile = dataDir + '/' + lesson.data_file;
  const dataObjects = JSON.parse(Deno.readTextFileSync(lessonDataFile));
  const lessonDataDir = dataDir + '/' + lesson.id;
  const lessonOutDir = outDir + '/' + lesson.id;
  Deno.mkdirSync(lessonOutDir);
  copyLessonResources(lesson, lessonDataDir, lessonOutDir, dataObjects);
  generateInfoPages(dataObjects, lessonOutDir, lesson);
  generateInputPages(dataObjects, lessonOutDir, lesson);
}

function generateInputPages(dataObjects, lessonOutDir, lesson) {
  for (let i = 0; i < dataObjects.length; i++) {
    const filePath = lessonOutDir + '/' + link_input(i);
    const dataObject = dataObjects[i];
    const link1 = i === 0 ? link_info(dataObjects.length - 1) : link_input(i - 1);
    const link2 = i === dataObjects.length - 1 ? "../index.html" : link_input(i + 1);
    const gradient_width = (dataObject.word_de.length * 1.5 - 0.5).toString();
    const dataView = {
      "PAGE_TITLE": lesson.name + ' - ' + 'Input',
      "WORD_DE": dataObject.word_de,
      "INPUT_WIDTH": (dataObject.word_de.length * 1.5).toString(),
      "GRADIENT_WIDTH": gradient_width,
      "WORD_DE_LENGTH": dataObject.word_de.length.toString(),
      "WORD_EN": dataObject.word_en,
      "PIC_SRC_1": dataObject.pic_src_1,
      "PIC_SRC_2": dataObject.pic_src_2,
      "LINK_1": link1,
      "LINK_2": link2
    };
    const outStr = mustache.render(inputTemplateContents, dataView);
    Deno.writeTextFileSync(filePath, outStr);
  }
}

function generateInfoPages(dataObjects, lessonOutDir, lesson) {
  for (let i = 0; i < dataObjects.length; i++) {
    const link1 = i === 0 ? "../index.html" : link_info(i - 1);
    const link2 = i === dataObjects.length - 1 ? link_input(0) : link_info(i + 1);
    const filePath = lessonOutDir + '/' + link_info(i);
    const dataObject = dataObjects[i];
    const dataView = {
      "PAGE_TITLE": lesson.name + ' - ' + dataObject.word_de,
      "WORD_EN": dataObject.word_en,
      "PIC_SRC_1": dataObject.pic_src_1,
      "PIC_SRC_2": dataObject.pic_src_2,
      "PRONUNCIATION_1": dataObject.pronunciation_1,
      "PRONUNCIATION_2": dataObject.pronunciation_2,
      "WORD_DE": dataObject.word_de,
      "LINK_1": link1,
      "LINK_2": link2
    };
    const outStr = mustache.render(infoTemplateContents, dataView);
    Deno.writeTextFileSync(filePath, outStr);
  }
}

function copyLessonResources(lesson, lessonDataDir, lessonOutDir, dataObjects) {
  Deno.copyFileSync(
    dataDir + '/' + lesson.bg_img,
    outDir + '/' + lesson.bg_img
  );
  Deno.copyFileSync(lessonDataDir + '/' + 'background.jpg', lessonOutDir + '/' + 'background.jpg');
  for (let i = 0; i < dataObjects.length; i++) {
    copyLessonResource(lessonDataDir, lessonOutDir, dataObjects[i].pic_src_1);
    copyLessonResource(lessonDataDir, lessonOutDir, dataObjects[i].pic_src_2);
    copyLessonResource(lessonDataDir, lessonOutDir, dataObjects[i].pronunciation_1);
    copyLessonResource(lessonDataDir, lessonOutDir, dataObjects[i].pronunciation_2);
  }
}

function copyLessonResource(lessonDataDir, lessonOutDir, relativePath) {
  if (isLocal(relativePath)) {
    Deno.copyFileSync(
      lessonDataDir + '/' + relativePath,
      lessonOutDir + '/' + relativePath
    );
  }
}

function isLocal(s) {
  const re = /^\w+:\/\//;
  return s.match(re) === null;
}

let accLessons = [];
for (let lesson_i = 0; lesson_i < lessons.length; lesson_i++) {
  const lesson = lessons[lesson_i];
  const lessonDataFile = dataDir + '/' + lesson.data_file;
  const lessonDataObjects = JSON.parse(Deno.readTextFileSync(lessonDataFile));
  let accWordlist = [];
  for (let i = 0; i < lessonDataObjects.length; i++) {
    accWordlist.push({"WORD_DE": lessonDataObjects[i].word_de});
  };
  const lessonDataView =
    {
      "NAME": lesson.name,
      "TOPIC_NUM": lesson_i + 1,
      "WORDLIST": accWordlist,
      "TOPIC_ID": lesson.id,
      "TOPIC_BG": lesson.bg_img,
      "LINK": lesson.id + '/' + link_info(0)
    };
    accLessons.push(lessonDataView);
}

const indexDataView =
  {
    "LESSONS": accLessons
  }
const indexOutStr = mustache.render(indexTemplateContents, indexDataView);
Deno.writeTextFileSync(outDir + '/' + 'index.html', indexOutStr);
Deno.copyFileSync(
  dataDir + '/' + 'background.jpg',
  outDir + '/' + 'background.jpg'
);
