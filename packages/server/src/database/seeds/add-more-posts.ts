import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'space_hunter',
  synchronize: false,
});

interface NewPost {
  sectionName: string;
  userIndex: number;
  title: string;
  content: string;
  images: { url: string; type: string }[] | null;
  tags: string[];
  likes: number;
  comments: number;
  daysAgo: number;
}

const newPosts: NewPost[] = [
  {
    sectionName: '观测分享',
    userIndex: 1,
    title: '礁湖星云M8 - 夏季星空的宝藏',
    content: '夏季大三角附近的礁湖星云，是南天最明亮的发射星云之一。这张照片使用了H-alpha滤镜，突出了星云的丝状结构。\n\n设备：\n- 主镜：锐星65Q\n- 赤道仪：艾顿CEM25P\n- 相机：QHY163M\n- 总曝光：8小时',
    images: [{ url: 'https://picsum.photos/id/1025/1200/800', type: 'image' }],
    tags: ['M8', '礁湖星云', '夏季星空', '发射星云'],
    likes: 42,
    comments: 12,
    daysAgo: 2,
  },
  {
    sectionName: '观测分享',
    userIndex: 2,
    title: 'NGC 7000 北美星云 - 鹈鹕星云广域',
    content: '第一次尝试广域深空，目标是天津四附近的北美星云和鹈鹕星云。用35mm镜头拍了一个晚上，虽然细节一般，但气势出来了。\n\n拍摄参数：\n- 镜头：适马35mm f/1.4 Art\n- 机身：尼康D810A改机\n- 参数：f/2, ISO 1600, 60s x 120张',
    images: [
      { url: 'https://picsum.photos/id/1029/1600/1000', type: 'image' },
      { url: 'https://picsum.photos/id/1039/1200/800', type: 'image' },
    ],
    tags: ['NGC7000', '北美星云', '广域', '鹈鹕星云'],
    likes: 38,
    comments: 9,
    daysAgo: 3,
  },
  {
    sectionName: '设备讨论',
    userIndex: 4,
    title: '新手入门：双筒望远镜怎么选？',
    content: '很多新手第一个问题就是：我该买什么望远镜？其实对于入门者，我最推荐的是双筒望远镜，原因如下：\n\n1. 价格便宜：几百块就能买不错的\n2. 便携：随时拎着就走\n3. 视野大：找目标容易\n4. 不用维护：比折射镜省事多了\n\n推荐型号：\n- 入门：博冠猎手II 10x50（约300元）\n- 进阶：蔡司大地女神 10x42（约3000元）\n- 发烧：富士龙 16x70（约8000元）',
    images: null,
    tags: ['双筒望远镜', '入门指南', '器材选购'],
    likes: 156,
    comments: 23,
    daysAgo: 5,
  },
  {
    sectionName: '天文知识',
    userIndex: 6,
    title: '【天文小知识】什么是"视星等"？',
    content: '经常看到有人说这颗星是几等星，今天聊聊什么是视星等。\n\n视星等（Apparent Magnitude）是我们从地球上看到的星星的亮度，数值越小越亮。\n\n- 最亮的恒星：天狼星，-1.46等\n- 北极星：约2等\n- 人眼极限：约6.5等\n- 双筒望远镜可见：约10等\n- 大型望远镜：可达20等以上\n\n注意：星等差5等，亮度差正好是100倍。也就是说，1等星比6等星亮100倍。',
    images: [{ url: 'https://picsum.photos/id/1043/1000/700', type: 'image' }],
    tags: ['视星等', '天文知识', '入门科普'],
    likes: 203,
    comments: 15,
    daysAgo: 7,
  },
  {
    sectionName: '活动招募',
    userIndex: 5,
    title: '【线上活动】深空摄影后期处理分享会',
    content: '本周五晚8点，邀请到深空摄影大佬 @银河守望者 在线分享他的后期处理工作流程。\n\n内容：\n- PixInsight基础流程\n- 降噪技巧\n- 颜色合成\n- 背景校正\n\n方式：腾讯会议（报名后发会议号）\n费用：免费\n名额：限100人',
    images: null,
    tags: ['线上活动', '后期处理', 'PixInsight', '分享会'],
    likes: 78,
    comments: 34,
    daysAgo: 4,
  },
  {
    sectionName: '求助',
    userIndex: 3,
    title: '求助：单反改机 vs 冷冻相机，到底怎么选？',
    content: '玩了一年天文摄影，一直用改机单反，现在想升级，在考虑是否上冷冻相机。\n\n想请教各位大佬：\n1. 改机和冷冻相机画质差距到底有多大？\n2. 主要拍星系和星云，选哪类相机？\n3. 预算1万左右有什么推荐？\n4. 黑白机+滤镜轮是不是比彩色机好？\n\n感谢各位！',
    images: null,
    tags: ['器材升级', '冷冻相机', '改机', '求助'],
    likes: 92,
    comments: 18,
    daysAgo: 2,
  },
  {
    sectionName: '观测分享',
    userIndex: 1,
    title: '昴星团M45 - 七姐妹星团',
    content: '昴星团，又称七姐妹，是最著名的疏散星团之一。肉眼可见6-7颗星，望远镜下能看到几十颗，还有美丽的蓝色反射星云。\n\n这张是用长焦镜头拍的，反射星云的蓝色很梦幻。\n\n设备：\n- 镜头：佳能100-400mm II\n- 机身：6D改机\n- 曝光：2小时',
    images: [{ url: 'https://picsum.photos/id/1050/1200/800', type: 'image' }],
    tags: ['M45', '昴星团', '疏散星团', '反射星云'],
    likes: 67,
    comments: 11,
    daysAgo: 6,
  },
  {
    sectionName: '设备讨论',
    userIndex: 2,
    title: 'DIY一个廉价的电动调焦座',
    content: '原厂电动调焦太贵了，自己DIY了一个，成本不到200块，分享给大家。\n\n材料：\n- 28BYJ-48步进电机：15元\n- ULN2003驱动板：10元\n- 同步轮同步带：20元\n- 3D打印支架：50元\n- Arduino Nano：30元\n\n效果：调焦精度还不错，配合PHD2导星可以自动调焦。\n缺点：速度比较慢，而且噪音有点大。\n\n有兴趣的朋友可以留言，我发详细教程。',
    images: [{ url: 'https://picsum.photos/id/1059/1000/700', type: 'image' }],
    tags: ['DIY', '电动调焦', '经验分享', '器材改造'],
    likes: 89,
    comments: 27,
    daysAgo: 8,
  },
];

const commentTemplates = [
  '拍得真好！学习了',
  '请问总曝光多长时间？',
  '这个后期处理得很棒啊',
  '同好你好，同款设备路过',
  '收藏了，慢慢学习',
  '光污染条件怎么样？',
  '感谢分享，很有帮助！',
  '大佬带带我~',
  '细节拉满了，厉害',
  '请问用的什么滤镜？',
  '期待更多作品！',
  '这个目标我也想拍',
  '请问在哪里拍的？',
  '构图很不错',
  '色彩真好看',
];

async function run() {
  await AppDataSource.initialize();
  console.log('数据库连接成功');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const usersRes = await queryRunner.query(
      `SELECT id FROM users WHERE role = 'user' ORDER BY id`
    );
    const sectionsRes = await queryRunner.query(
      `SELECT id, name FROM sections ORDER BY id`
    );

    const userIds = usersRes.map((u: any) => u.id);
    const sectionMap = new Map(sectionsRes.map((s: any) => [s.name, s.id]));

    console.log(`找到 ${userIds.length} 个用户，${sectionMap.size} 个板块`);

    let addedCount = 0;

    for (const mp of newPosts) {
      const sectionId = sectionMap.get(mp.sectionName);
      if (!sectionId) {
        console.log(`跳过：找不到板块 "${mp.sectionName}"`);
        continue;
      }

      const userId = userIds[mp.userIndex % userIds.length];

      const existingRes = await queryRunner.query(
        `SELECT id FROM posts WHERE title = $1`,
        [mp.title]
      );
      if (existingRes.length > 0) {
        console.log(`跳过已存在的帖子：${mp.title}`);
        continue;
      }

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - mp.daysAgo);

      const imagesJson = mp.images ? JSON.stringify(mp.images) : null;
      const tagsJson = JSON.stringify(mp.tags);

      const res = await queryRunner.query(
        `INSERT INTO posts (user_id, section_id, title, content, images, tags, has_fits, status, like_count, comment_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, false, 'published', $7, $8, $9, $9)
         RETURNING id`,
        [userId, sectionId, mp.title, mp.content, imagesJson, tagsJson, mp.likes, mp.comments, createdAt]
      );

      const postId = res[0].id;
      console.log(`已添加帖子：${mp.title} (ID: ${postId})`);

      for (let i = 0; i < mp.comments; i++) {
        const commentUserId = userIds[(mp.userIndex + i + 1) % userIds.length];
        const commentText = commentTemplates[i % commentTemplates.length];
        const commentCreatedAt = new Date(createdAt.getTime() + (i + 1) * 3600000);

        await queryRunner.query(
          `INSERT INTO comments (post_id, user_id, content, created_at)
           VALUES ($1, $2, $3, $4)`,
          [postId, commentUserId, commentText, commentCreatedAt]
        );
      }

      addedCount++;
    }

    console.log(`\n完成！共添加 ${addedCount} 篇新帖子`);

    const totalRes = await queryRunner.query(
      `SELECT count(*) as cnt FROM posts WHERE status = 'published'`
    );
    console.log(`当前帖子总数：${totalRes[0].cnt}`);
  } catch (error) {
    console.error('出错了：', error);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

run().catch(console.error);
