-- 更新已有帖子的图片URL
-- M42猎户座大星云
UPDATE posts SET images = jsonb_build_array(
  jsonb_build_object('url', 'https://esahubble.org/media/archives/images/screen/opo9410a.jpg', 'type', 'image'),
  jsonb_build_object('url', 'https://esahubble.org/media/archives/images/screen/heic2505h.jpg', 'type', 'image')
) WHERE title = 'M42猎户座大星云最新拍摄 - 32小时累计曝光';

-- 银河拱桥
UPDATE posts SET images = jsonb_build_array(
  jsonb_build_object('url', 'https://noirlab.edu/public/media/archives/images/screen/noirlab2430b.jpg', 'type', 'image')
) WHERE title = '七夕之夜的银河拱桥 - 青海冷湖纪录';

-- 窄带滤镜科普
UPDATE posts SET images = jsonb_build_array(
  jsonb_build_object('url', 'https://esahubble.org/media/archives/images/screen/heic2505h.jpg', 'type', 'image')
) WHERE title = '【科普】为什么天文摄影要使用"窄带滤镜"？';

-- 英仙座流星雨
UPDATE posts SET images = jsonb_build_array(
  jsonb_build_object('url', 'https://esahubble.org/media/archives/images/screen/heic1606a.jpg', 'type', 'image')
) WHERE title = '【8月英仙座流星雨】舟山群岛观测召集';

-- 土星冲日
UPDATE posts SET images = jsonb_build_array(
  jsonb_build_object('url', 'https://esahubble.org/media/archives/images/screen/heic1917a.jpg', 'type', 'image')
) WHERE title = '土星冲日实拍 - 卡西尼缝清晰可见';

-- 阳台天文台
UPDATE posts SET images = jsonb_build_array(
  jsonb_build_object('url', 'https://esahubble.org/media/archives/images/screen/heic0706a.jpg', 'type', 'image')
) WHERE title = '分享一下我的"暗房"——阳台天文台改造';

-- M31仙女座星系
UPDATE posts SET images = jsonb_build_array(
  jsonb_build_object('url', 'https://esahubble.org/media/archives/images/screen/heic1502a.jpg', 'type', 'image')
) WHERE title = 'Andromeda Galaxy M31 - 我的第一个深空目标';

-- 更新画廊照片URL
-- 猎户座大星云 M42
UPDATE gallery_photos SET image_url = 'https://esahubble.org/media/archives/images/screen/opo9410a.jpg', original_url = 'https://esahubble.org/media/archives/images/screen/opo9410a.jpg' WHERE title = '猎户座大星云 M42';

-- 银河拱桥
UPDATE gallery_photos SET image_url = 'https://noirlab.edu/public/media/archives/images/screen/noirlab2430b.jpg', original_url = 'https://noirlab.edu/public/media/archives/images/screen/noirlab2430b.jpg' WHERE title = '银河拱桥';

-- 土星特写
UPDATE gallery_photos SET image_url = 'https://esahubble.org/media/archives/images/screen/heic1917a.jpg', original_url = 'https://esahubble.org/media/archives/images/screen/heic1917a.jpg' WHERE title = '土星特写';

-- 昴星团 M45
UPDATE gallery_photos SET image_url = 'https://noirlab.edu/public/media/archives/images/screen/noao-m45.jpg', original_url = 'https://noirlab.edu/public/media/archives/images/screen/noao-m45.jpg' WHERE title = '昴星团 M45';

-- 玫瑰星云 NGC2237
UPDATE gallery_photos SET image_url = 'https://esahubble.org/media/archives/images/screen/heic2505h.jpg', original_url = 'https://esahubble.org/media/archives/images/screen/heic2505h.jpg' WHERE title = '玫瑰星云 NGC2237';