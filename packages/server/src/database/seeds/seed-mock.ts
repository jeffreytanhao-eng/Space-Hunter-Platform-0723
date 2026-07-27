import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'space_hunter',
  synchronize: true,
});

const mockUsers = [
  { phone: '13800000001', nickname: '星空漫步者', bio: '深空摄影爱好者，喜欢拍摄星云和星系', interests: ['深空摄影', '星系', '星云'], equipment: '信达EQ6R + ZWO ASI294MC Pro' },
  { phone: '13800000002', nickname: '月球猎人', bio: '月面观测专家，专注于月球地貌研究', interests: ['月球观测', '行星摄影'], equipment: '星特朗C11 + ASI224MC' },
  { phone: '13800000003', nickname: '银河守望者', bio: '银河季来临，出发去追星星吧！', interests: ['银河摄影', '星野', '延时摄影'], equipment: '索尼A7R5 + 14mm f/1.8' },
  { phone: '13800000004', nickname: '彗星追逐者', bio: '哪里有彗星，哪里就有我', interests: ['彗星观测', '小行星', '特殊天象'], equipment: '高桥ED102 + ASI183MM' },
  { phone: '13800000005', nickname: '天文小白', bio: '刚刚入坑天文，请多关照~', interests: ['入门学习', '双筒观测'], equipment: '双筒望远镜 10x50' },
  { phone: '13800000006', nickname: '轨道计算控', bio: '用数学追踪星辰的轨迹', interests: ['轨道力学', '天文计算', '编程'], equipment: '电脑 + 各种天文软件' },
];

interface MockPost {
  section: string;
  title: string;
  content: string;
  images: { url: string; type: string }[] | null;
  tags: string[];
}

const mockPosts: MockPost[] = [
  { section: '观测分享', title: 'M42猎户座大星云最新拍摄 - 32小时累计曝光', content: '经过三个晴朗的夜晚，终于完成了M42猎户座大星云的深度拍摄。总曝光时间32小时，使用了H-alpha/OIII/SII窄带滤镜，后期采用HOO合成。星云的纤维状结构清晰可见，猎户座四边形星团也分辨得很好。\n\n设备：\n- 主镜：高桥TOA-130\n- 赤道仪：信达EQ6R Pro\n- 相机：ZWO ASI2600MM Pro\n- 滤镜：Antlia 3nm窄带套', images: [
    { url: 'https://esahubble.org/media/archives/images/large/opo9410a.jpg', type: 'image' },
  ], tags: ['M42', '猎户座星云', '窄带摄影', '深空摄影'] },
  { section: '观测分享', title: '七夕之夜的银河拱桥 - 青海冷湖纪录', content: '今年七夕去了一趟青海冷湖，那里的暗夜条件真的太棒了！光污染等级几乎为1级，银河肉眼可见。这张银河拱桥是用20张照片拼接而成，前景是当地的雅丹地貌。\n\n拍摄参数：\n- 机身：索尼A7R5\n- 镜头：适马14mm f/1.8 DG DN\n- 参数：f/1.8, ISO 3200, 15s x 20张拼接', images: [
    { url: 'https://noirlab.edu/public/media/archives/images/screen/noirlab2430b.jpg', type: 'image' },
  ], tags: ['银河', '星野摄影', '冷湖', '拼接'] },
  { section: '设备讨论', title: 'ZWO ASI2600 vs QHY268C 怎么选？用过的来聊聊', content: '最近想升级制冷相机，在ZWO ASI2600MC Pro和QHY268C之间纠结。两者都是APS-C画幅，都是2600万像素左右，价格也差不多。\n\n已了解的差异：\n1. ASI2600是背照式CMOS，QHY268C是前照式？\n2. 读出噪声ASI更低一些\n3. QHY的制冷效果好像更好\n\n有没有实际用过这两台的朋友，聊聊实际使用感受？主要拍行星还是深空？', images: null, tags: ['器材选购', 'ASI2600', 'QHY268C', '制冷相机'] },
  { section: '设备讨论', title: '赤道仪选信达EQ6R还是艾顿CEM70？', content: '预算5000左右，主镜大概5-7kg，主要拍深空。看了很多评测还是拿不定主意，希望各位大佬给点建议。\n\nEQ6R优点：载重更大、保有量高、配件多\nCEM70优点：双涡轮、精度据说更高、更轻\n\n有人说EQ6R载重够了但精度一般，也有人说CEM70精度虽高但载重有点虚标。到底选哪个啊？', images: null, tags: ['赤道仪', 'EQ6R', 'CEM70', '选购建议'] },
  { section: '天文知识', title: '【科普】为什么天文摄影要使用"窄带滤镜"？', content: '经常看到有人说窄带摄影，今天简单聊聊什么是窄带滤镜，以及为什么要用它。\n\n什么是窄带滤镜？\n窄带滤镜只允许非常窄的特定波长的光通过（通常只有几纳米），常见的有：\n- H-alpha：656.3nm（氢的红光发射线）\n- OIII：500.7nm（氧的蓝绿光发射线）\n- SII：672.4nm（硫的红光发射线）\n\n为什么要用窄带？\n1. 抑制光污染：城市里也能拍深空\n2. 提高对比度：突出星云的发射线\n3. 哈勃色：SII+Hα+OIII合成经典哈勃色', images: [
    { url: 'https://esahubble.org/media/archives/images/screen/heic2505h.jpg', type: 'image' },
  ], tags: ['科普', '窄带滤镜', '天文知识', '入门'] },
  { section: '求助', title: '新手求助：为什么我的星点总是拖线？', content: '刚入门，第一次试拍就遇到问题了，长曝光星点全是拖线，看了很多教程还是没找到原因，来这里求大佬们帮忙看看。\n\n设备：小黑+EQ3D\n曝光：30秒 ISO1600\n已经做了：极轴镜粗对、平衡调了、导星还没买\n\n是我极轴没对准吗？还是平衡没调好？30秒就拖线这么厉害正常吗？', images: null, tags: ['新手求助', '星点拖线', '极轴校准', '导星'] },
  { section: '活动招募', title: '【8月英仙座流星雨】舟山群岛观测召集', content: '一年一度的英仙座流星雨又来了！今年极大值预计在8月12日晚，刚好是周末，计划组织一次舟山群岛的海边观测活动。\n\n时间：8月11日-13日（2晚）\n地点：舟山某海岛（具体报名后告知）\n费用：AA制，预计每人500-800元（含住宿）\n名额：限15人\n\n有意向的请在评论区留言或私信我！', images: [
    { url: 'https://esahubble.org/media/archives/images/screen/heic1606a.jpg', type: 'image' },
  ], tags: ['流星雨', '英仙座', '线下活动', '观测活动'] },
  { section: '观测分享', title: '土星冲日实拍 - 卡西尼缝清晰可见', content: '今年土星冲日拍的，视宁度不错，卡西尼缝清清楚楚！土星的六边形风暴也隐约可见。\n\n拍摄参数：\n- 望远镜：星特朗C11 XLT\n- 巴洛：Tele Vue 2.5x Powermate\n- 相机：ASI224MC\n- 视频：3分钟，叠加10000帧\n\n后期用AutoStakkert!3叠加，Registax 6锐化。', images: [
    { url: 'https://esahubble.org/media/archives/images/screen/heic1917a.jpg', type: 'image' },
  ], tags: ['土星', '行星摄影', '冲日', '卡西尼缝'] },
  { section: '天文知识', title: '【深度】梅西耶目录：110个天体背后的故事', content: '梅西耶目录是天文爱好者最熟悉的深空天体表，包含110个明亮的深空天体。但你知道吗？这个目录的初衷竟然是为了"避免认错彗星"！\n\n查尔斯·梅西耶是18世纪法国天文学家，他一生都在寻找彗星。但他经常把一些模糊的星云状天体误认为是彗星，于是他把这些"不是彗星的模糊天体"记录下来，就成了梅西耶目录。\n\n有趣的冷知识：\n- M40是一对双星，因为梅西耶误以为它是星云\n- M102其实和M101是同一个天体，记录重复了\n- M45（昴星团）其实肉眼可见，完全不需要望远镜', images: null, tags: ['梅西耶', '天文史', '科普', '深空天体'] },
  { section: '求助', title: '摄影头导星一直丢星怎么办？', content: '换了ASI120MM-Mini导星相机，但是导星总是不稳定，十几分钟就丢星一次，误差曲线特别难看。\n\n配置：\n- 导星镜：50mm寻星镜改的\n- 相机：ASI120MM-Mini\n- 软件：PHD2\n- 赤道仪：EQ6R\n\nPHD2里的导星误差总是在1-2角秒波动，有时候还会突然跳到5角秒以上。是导星镜焦距太短了吗？还是极轴没对准？', images: null, tags: ['导星', 'PHD2', 'ASI120MM', '求助'] },
  { section: '设备讨论', title: '分享一下我的"暗房"——阳台天文台改造', content: '住高层公寓，没有条件弄真正的天文台，只能在阳台上折腾。分享一下我的布置经验，给同样住城市的同好参考。\n\n1. 阳台方位：朝南偏东，避开对面楼的灯光\n2. 遮光处理：用黑布把阳台封起来，减少室内光干扰\n3. 电源：外接了一个防水插板，从室内走线\n4. 电脑控制：用无线网桥把电脑信号传到阳台\n5. 设备收纳：做了个带锁的柜子，不下雨的时候推出来\n\n虽然条件有限，但至少不用出门就能拍，对上班族来说够用了。', images: [
    { url: 'https://esahubble.org/media/archives/images/screen/heic0706a.jpg', type: 'image' },
  ], tags: ['阳台党', '经验分享', '设备改造', '城市观测'] },
  { section: '观测分享', title: 'Andromeda Galaxy M31 - 我的第一个深空目标', content: '入坑三个月，终于拍出了第一张能看的深空照片——仙女座大星系M31！虽然和大佬们的比还差很远，但自己已经很满意了。\n\n设备：\n- 望远镜：小黑（信达150/750）\n- 赤道仪：EQ3D（电跟）\n- 相机：佳能60Da改机\n- 总曝光：约2小时（30s x 240张）\n\n感谢论坛里各位大佬的指导，从对极轴到后期处理都是在这里学的！', images: [
    { url: 'https://esahubble.org/media/archives/images/screen/heic1502a.jpg', type: 'image' },
  ], tags: ['M31', '仙女座星系', '新手作品', '深空摄影'] },
];

const mockGallery = [
  { title: '马头星云 IC434', description: '哈勃拍摄的经典暗星云', imageUrl: 'https://esahubble.org/media/archives/images/large/heic0309a.jpg', category: 'deep_sky' },
  { title: '银河拱桥', description: '青海冷湖银河季拍摄', imageUrl: 'https://noirlab.edu/public/media/archives/images/screen/noirlab2430b.jpg', category: 'starfield' },
  { title: '土星特写', description: '冲日拍摄，卡西尼缝可见', imageUrl: 'https://esahubble.org/media/archives/images/large/heic1917a.jpg', category: 'solar_system' },
  { title: '昴星团 M45', description: '蓝色反射星云', imageUrl: 'https://noirlab.edu/public/media/archives/images/screen/noao-m45.jpg', category: 'deep_sky' },
  { title: '玫瑰星云 NGC2237', description: '情人节的宇宙礼物', imageUrl: 'https://esahubble.org/media/archives/images/large/heic2505h.jpg', category: 'deep_sky' },
];

const mockComments = [
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
];

async function run() {
  await AppDataSource.initialize();
  console.log('数据库连接成功');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const passwordHash = await bcrypt.hash('123456', 10);

    console.log('--- 1. 检查/创建管理员 ---');
    const adminResult = await queryRunner.query(`SELECT id FROM users WHERE phone = 'admin'`);
    let adminId: string;
    if (adminResult.length === 0) {
      const res = await queryRunner.query(
        `INSERT INTO users (phone, nickname, role, status, points_balance, bio, privacy_profile, privacy_dynamic)
         VALUES ('admin', '超级管理员', 'admin', 'active', 9999, '系统超级管理员', 'public', 'public')
         RETURNING id`
      );
      adminId = res[0].id;
      console.log(`  创建管理员成功，ID: ${adminId}`);
    } else {
      adminId = adminResult[0].id;
      await queryRunner.query(
        `UPDATE users SET nickname = '超级管理员', role = 'admin', status = 'active', points_balance = 9999 WHERE id = $1`,
        [adminId]
      );
      console.log(`  管理员已更新，ID: ${adminId}`);
    }

    console.log('--- 2. 创建 Mock 用户 ---');
    const userIds: string[] = [];
    for (const mu of mockUsers) {
      const res = await queryRunner.query(`SELECT id FROM users WHERE phone = $1`, [mu.phone]);
      if (res.length === 0) {
        const ins = await queryRunner.query(
          `INSERT INTO users (phone, nickname, role, status, points_balance, bio, interests, equipment, privacy_profile, privacy_dynamic)
           VALUES ($1, $2, 'user', 'active', $3, $4, $5::jsonb, $6, 'public', 'public')
           RETURNING id`,
          [mu.phone, mu.nickname, Math.floor(Math.random() * 5000) + 500, mu.bio, JSON.stringify(mu.interests), mu.equipment]
        );
        userIds.push(ins[0].id);
        console.log(`  创建用户: ${mu.nickname}`);
      } else {
        userIds.push(res[0].id);
        console.log(`  用户已存在: ${mu.nickname}`);
      }
    }

    console.log('--- 3. 获取板块 ---');
    const sections = await queryRunner.query(`SELECT id, name FROM sections ORDER BY sort_order`);
    const sectionMap = new Map(sections.map((s: any) => [s.name, s.id]));
    console.log(`  已加载 ${sections.length} 个板块`);

    console.log('--- 4. 创建互相关注 ---');
    let followCount = 0;
    for (let i = 0; i < userIds.length; i++) {
      for (let j = 0; j < userIds.length; j++) {
        if (i !== j && Math.random() > 0.4) {
          const existing = await queryRunner.query(
            `SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2`,
            [userIds[i], userIds[j]]
          );
          if (existing.length === 0) {
            await queryRunner.query(
              `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)`,
              [userIds[i], userIds[j]]
            );
            followCount++;
          }
        }
      }
    }
    console.log(`  创建了 ${followCount} 条关注关系`);

    console.log('--- 5. 创建 Mock 帖子 ---');
    let postCount = 0;
    for (const mp of mockPosts) {
      const sectionId = sectionMap.get(mp.section);
      if (!sectionId) continue;

      const existing = await queryRunner.query(`SELECT id FROM posts WHERE title = $1`, [mp.title]);
      if (existing.length > 0) continue;

      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const likeCount = Math.floor(Math.random() * 200) + 10;
      const commentCount = Math.floor(Math.random() * 8) + 2;

      const res = await queryRunner.query(
        `INSERT INTO posts (user_id, section_id, title, content, images, tags, has_fits, status, like_count, comment_count)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, false, 'published', $7, $8)
         RETURNING id`,
        [userId, sectionId, mp.title, mp.content,
         mp.images ? JSON.stringify(mp.images) : null,
         JSON.stringify(mp.tags),
         likeCount, commentCount]
      );
      const postId = res[0].id;
      postCount++;

      for (let c = 0; c < commentCount; c++) {
        const commentUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const commentText = mockComments[Math.floor(Math.random() * mockComments.length)];
        await queryRunner.query(
          `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3)`,
          [postId, commentUserId, commentText]
        );
      }
    }
    console.log(`  创建了 ${postCount} 篇帖子`);

    console.log('--- 6. 创建画廊照片 ---');
    let galleryCount = 0;
    for (const mg of mockGallery) {
      const existing = await queryRunner.query(`SELECT id FROM gallery_photos WHERE title = $1`, [mg.title]);
      if (existing.length > 0) {
        // 已存在：迁移分类值与图片 URL（修复旧 seed 遗留的 nebula/milkyway/planet/cluster 与 screen 残缺图）
        await queryRunner.query(
          `UPDATE gallery_photos SET category = $1, image_url = $2 WHERE id = $3`,
          [mg.category, mg.imageUrl, existing[0].id]
        );
        continue;
      }

      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      await queryRunner.query(
        `INSERT INTO gallery_photos (user_id, title, description, image_url, original_url, category, status, points_awarded, like_count)
         VALUES ($1, $2, $3, $4, $5, $6, 'approved', 100, $7)`,
        [userId, mg.title, mg.description, mg.imageUrl, mg.imageUrl, mg.category,
         Math.floor(Math.random() * 500) + 50]
      );
      galleryCount++;
    }
    console.log(`  创建了 ${galleryCount} 张画廊照片`);

    console.log('--- 7. 创建活动 ---');
    let eventCount = 0;
    const eventsData = [
      { title: '8月英仙座流星雨观测活动', description: '一年一度的英仙座流星雨极大值，舟山群岛海边观测，3天2晚', location: '浙江舟山', startTime: '2026-08-11 18:00:00+08', endTime: '2026-08-13 12:00:00+08', maxParticipants: 15, isOfficial: true, status: 'approved' },
      { title: '秋季深空摄影入门工作坊', description: '线下实操教学：从极轴校准到后期处理，零基础可参加', location: '北京·密云', startTime: '2026-09-20 09:00:00+08', endTime: '2026-09-21 18:00:00+08', maxParticipants: 20, isOfficial: false, status: 'approved' },
      { title: '双子座流星雨跨年趴', description: '12月流星雨之王，和同好一起迎接新年', location: '内蒙古·乌兰布统', startTime: '2026-12-13 17:00:00+08', endTime: '2026-12-15 12:00:00+08', maxParticipants: 30, isOfficial: true, status: 'approved' },
    ];
    for (const me of eventsData) {
      const existing = await queryRunner.query(`SELECT id FROM events WHERE title = $1`, [me.title]);
      if (existing.length > 0) continue;

      const creatorId = userIds[Math.floor(Math.random() * userIds.length)];
      await queryRunner.query(
        `INSERT INTO events (creator_id, title, description, location_type, location, start_time, end_time, max_participants, current_participants, status, is_official)
         VALUES ($1, $2, $3, 'offline', $4, $5::timestamptz, $6::timestamptz, $7, $8, $9, $10)`,
        [creatorId, me.title, me.description, me.location, me.startTime, me.endTime,
         me.maxParticipants, Math.floor(Math.random() * 10) + 1, me.status, me.isOfficial]
      );
      eventCount++;
    }
    console.log(`  创建了 ${eventCount} 个活动`);

    console.log('');
    console.log('=== Mock 数据生成完成 ===');
    console.log(`管理员: admin / 密码: 123456`);
    console.log(`测试用户: 13800000001 ~ 13800000006 / 密码: 123456`);
    console.log(`用户数: ${userIds.length + 1}`);
    console.log(`帖子数: ${postCount}`);
    console.log(`画廊数: ${galleryCount}`);
    console.log(`活动数: ${eventCount}`);
    console.log(`关注关系: ${followCount}`);

  } finally {
    await queryRunner.release();
  }

  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('执行失败:', err);
  process.exit(1);
});
