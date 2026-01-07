
import { GoogleGenAI, Type } from "@google/genai";
import { NPC, OutcomeType, Race, SocialClass } from "./types";
import { COLORS, EYE_COLORS, FACE_SHAPES, EYE_SHAPES } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateRandomNPC(generation: number = 1, baseStats?: Partial<NPC>): Promise<NPC> {
  const races = Object.values(Race);
  const classes = Object.values(SocialClass);
  const race = baseStats?.race || races[Math.floor(Math.random() * races.length)];
  const socialClass = baseStats?.socialClass || classes[Math.floor(Math.random() * classes.length)];
  
  // Local random logic for basic stats to ensure "true" randomness
  const combatVal = baseStats?.combat?.value ?? Math.floor(Math.random() * 101);
  const constVal = baseStats?.constitution?.value ?? Math.floor(Math.random() * 101);
  const intVal = baseStats?.intelligence?.value ?? Math.floor(Math.random() * 101);
  const appScore = baseStats?.appearance?.score ?? Math.floor(Math.random() * 101);

  const prompt = `
    请为一个西方奇幻冒险背景的游戏生成一个随机NPC。
    基本信息：种族 ${race}，社会阶层 ${socialClass}。
    数值参考（0-100）：武力 ${combatVal}，体质 ${constVal}，智慧 ${intVal}，美貌 ${appScore}。
    
    外貌要求：
    发色从 [${COLORS.join(',')}] 随机。
    瞳色从 [${EYE_COLORS.join(',')}] 随机。
    脸型从 [${FACE_SHAPES.join(',')}] 随机。
    眼型从 [${EYE_SHAPES.join(',')}] 随机。
    
    请用 JSON 格式返回，包含：
    identity (如：流浪诗人, 堕落骑士), tags (3个), personality, likes (3个), dislikes (3个), backstory (100字), preference (对对象的偏好)。
    同时补完武力、体质、智慧、外貌的具体描述。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identity: { type: Type.STRING },
          hairColor: { type: Type.STRING },
          eyeColor: { type: Type.STRING },
          faceShape: { type: Type.STRING },
          eyeShape: { type: Type.STRING },
          appearanceDescription: { type: Type.STRING },
          combatDescription: { type: Type.STRING },
          constDescription: { type: Type.STRING },
          intDescription: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          personality: { type: Type.STRING },
          likes: { type: Type.ARRAY, items: { type: Type.STRING } },
          dislikes: { type: Type.ARRAY, items: { type: Type.STRING } },
          backstory: { type: Type.STRING },
          preference: { type: Type.STRING }
        },
        required: ["identity", "hairColor", "eyeColor", "faceShape", "eyeShape", "tags", "personality", "likes", "dislikes", "backstory", "preference"]
      }
    }
  });

  const data = JSON.parse(response.text);

  return {
    id: Math.random().toString(36).substr(2, 9),
    identity: data.identity || "无名氏",
    race,
    socialClass,
    appearance: {
      score: appScore,
      hairColor: data.hairColor || "未知",
      eyeColor: data.eyeColor || "未知",
      faceShape: data.faceShape || "未知",
      eyeShape: data.eyeShape || "未知",
      description: data.appearanceDescription || "普普通通。"
    },
    combat: { value: combatVal, description: data.combatDescription || "平庸。" },
    constitution: { value: constVal, description: data.constDescription || "平庸。" },
    intelligence: { value: intVal, description: data.intDescription || "平庸。" },
    tags: Array.isArray(data.tags) ? data.tags : [],
    personality: data.personality || "未知",
    likes: Array.isArray(data.likes) ? data.likes : [],
    dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
    backstory: data.backstory || "没有故事的人。",
    preference: data.preference || "随缘。",
    generation
  };
}

export async function generateMarriageStory(p1: NPC, p2: NPC, outcome: OutcomeType): Promise<string> {
  const prompt = `
    在西方奇幻背景下，这两位NPC结婚了：
    NPC1: ${p1.identity} (${p1.race}), 性格: ${p1.personality}
    NPC2: ${p2.identity} (${p2.race}), 性格: ${p2.personality}
    
    结局类型：${outcome}
    (幸福：感情事业双丰收；平淡：一项成功一项平庸；怨偶：全方位失败甚至影响后代)
    
    请写一段约 200 字的婚后生活记述。包含他们的感情发展、事业变迁。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text;
}
