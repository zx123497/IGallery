// Artwork content. Where each piece hangs is defined by the room layouts in ./layout.
//
// author / character / description show on the wall label; leave one empty to show "--".
// story is the longer text in the detail view. hotspots are points of interest in the
// detail view, with x / y as fractions of the image width / height.
const artworkUrl = (file) => `${process.env.PUBLIC_URL}/artworks/${file}`;
const previewUrl = (file) => `${process.env.PUBLIC_URL}/artworks/preview/${file}`;

const ARTWORKS = [
  {
    id: "n1",
    file: "bd3d3459eb219c01c3ac489f2c1b238d.jpg",
    title: "回眸",
    author: "cocotte_ai",
    character: "初音未來",
    description: "藍綠雙馬尾，在白光裡轉身。",
    story: "",
    hotspots: [
      {x: 0.42, y: 0.48, label: "肩上的「01」", note: "手臂上的紅色「01」編號和名字刻印。"},
      {x: 0.6, y: 0.27, label: "耳機", note: "粉紅色的發光耳機，是角色的招牌配件。"},
      {x: 0.86, y: 0.3, label: "飄動的髮尾", note: "髮尾往右上方散開，帶出轉身的動勢。"},
    ],
  },
  {
    id: "n2",
    file: "0c41aba7666310369baea744a7e9402e.jpg",
    title: "學姊……",
    author: "",
    character: "",
    description: "背著書包、一臉不情願的放學後。",
    story: "",
    featured: true,
    hotspots: [
      {x: 0.15, y: 0.2, label: "對話框", note: "日文手寫對話框：「げぇっ センパイ…」。"},
      {x: 0.11, y: 0.58, label: "蛋包飯吊飾", note: "書包拉鍊上掛著蛋包飯和荷包蛋吊飾。"},
      {x: 0.49, y: 0.24, label: "波浪髮夾", note: "黃黑兩色的波浪髮夾。"},
    ],
  },
  {
    id: "n3",
    file: "b234ed72200e8d96227a3a377c29c704.jpg",
    title: "得意",
    author: "",
    character: "初音未來",
    description: "黑色外套與點點網底，自信的笑容。",
    story: "",
    hotspots: [
      {x: 0.16, y: 0.57, label: "閃光", note: "背景的四角星閃光和點點網底。"},
      {x: 0.57, y: 0.72, label: "綁帶馬甲", note: "交叉綁帶的黑色馬甲。"},
    ],
  },
  {
    id: "e1",
    file: "7d1a31b9edddfa9486c934d46ec931d1.jpg",
    title: "貓耳少年",
    author: "",
    character: "",
    description: "臉上貼著 OK 繃，尾巴悄悄翹起來。",
    story: "",
    hotspots: [
      {x: 0.55, y: 0.41, label: "OK 繃", note: "臉頰上交叉貼著的 OK 繃。"},
      {x: 0.93, y: 0.52, label: "尾巴", note: "從背後翹起來的貓尾巴。"},
    ],
  },
  {
    id: "s1",
    file: "9d8992e303e87c95cd038989bf56e74f.jpg",
    title: "YA！",
    author: "",
    character: "鏡音鈴",
    description: "金髮蝴蝶結，比出大大的勝利手勢。",
    story: "",
    hotspots: [
      {x: 0.36, y: 0.09, label: "勝利手勢", note: "高舉的 V 字手勢。"},
      {x: 0.84, y: 0.12, label: "蝴蝶結", note: "頭上的白色大蝴蝶結。"},
    ],
  },
  {
    id: "s2",
    file: "bd778c7aa7d3035d39f1c879c97f38dd.jpg",
    title: "布丁",
    author: "",
    character: "",
    description: "頭上頂著焦糖，披著黃色斗篷。",
    story: "",
    hotspots: [
      {x: 0.49, y: 0.07, label: "焦糖頭飾", note: "像布丁焦糖一樣的頭飾。"},
      {x: 0.86, y: 0.95, label: "小花", note: "斗篷下擺的白色小花圖樣。"},
    ],
  },
  {
    id: "w1",
    file: "3373675b912bca8e068f8b2f50a3a786.jpg",
    title: "橘色連帽衫",
    author: "",
    character: "",
    description: "瀏海遮住一隻眼睛，淡淡地笑著。",
    story: "",
    hotspots: [
      {x: 0.62, y: 0.55, label: "臉頰的線條", note: "臉頰上幾道短線，像貓鬚。"},
      {x: 0.6, y: 0.07, label: "呆毛", note: "頭頂翹起的一撮頭髮。"},
    ],
  },
].map(({file, ...artwork}) => ({url: artworkUrl(file), previewUrl: previewUrl(file), ...artwork}));

export const ARTWORKS_BY_ID = Object.fromEntries(ARTWORKS.map((artwork) => [artwork.id, artwork]));

export default ARTWORKS;
