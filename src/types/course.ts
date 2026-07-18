export type CourseStatus = 'Опубликован' | 'Черновик'
export type BlockType = 'heading'|'text'|'callout'|'audio'|'pdf'|'grammar'|'vocabulary'|'practice'|'conversation'|'flashcards'|'error_correction'|'translation'|'single_choice'
export type LessonSectionId = 'theory'|'conversation'|'listening'|'cards'|'errors'|'translation'|'practice'|'test'
export interface LessonSectionConfig { id:LessonSectionId; label:string; visible:boolean; order:number }
export interface Flashcard { front:string; back:string; hint:string }
export interface CorrectionItem { incorrect:string; correct:string; explanation:string }
export interface LessonBlock { id:string; type:BlockType; title:string; content:string; required:boolean; sectionId?:LessonSectionId; options?:string[]; correctOption?:number; explanation?:string; audioUrl?:string; audioPath?:string; transcript?:string; fileUrl?:string; filePath?:string; fileName?:string; fileSize?:number; cards?:Flashcard[]; role?:string; prompt?:string; starter?:string; sampleAnswer?:string; corrections?:CorrectionItem[]; sourceText?:string; targetText?:string; comprehensionQuestions?:string[] }
export interface Lesson { id:string; title:string; duration:number; status:CourseStatus; blocks:LessonBlock[]; sectionConfig?:LessonSectionConfig[]; sectionConfigBlockId?:string }
export interface CourseModule { id:string; title:string; open:boolean; lessons:Lesson[] }
export interface Course { id:string; title:string; description:string; cover:string; tag:string; status:CourseStatus; students:number; progress:number; updated:string; modules:CourseModule[] }
export interface Learner { id:string; name:string; email:string; course:string; progress:number; status:'Активен'|'Завершил' }
export interface Activity { initials:string; color:string; name:string; action:string; time:string }