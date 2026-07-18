export type CourseStatus = 'Опубликован' | 'Черновик'
export type BlockType = 'heading' | 'text' | 'callout' | 'audio' | 'single_choice'
export interface LessonBlock { id:string; type:BlockType; title:string; content:string; required:boolean; options?:string[]; correctOption?:number }
export interface Lesson { id:string; title:string; duration:number; status:CourseStatus; blocks:LessonBlock[] }
export interface CourseModule { id:string; title:string; open:boolean; lessons:Lesson[] }
export interface Course { id:string; title:string; description:string; cover:string; tag:string; status:CourseStatus; students:number; progress:number; updated:string; modules:CourseModule[] }
export interface Learner { id:string; name:string; email:string; course:string; progress:number; status:'Активен'|'Завершил' }
export interface Activity { initials:string; color:string; name:string; action:string; time:string }