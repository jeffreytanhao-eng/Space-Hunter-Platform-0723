# 前期准备

1. 前往 [应用中心](https://spacemapper.cn/personal/?active=myApp) 创建应用 获取 appId
2. 应用审核通过后 进行授权配置 获取 appKey 和 appSecret
3. 将appId 发送给管理员
# API Docs

Base URLs:

* <a href="https://spacemapper.cn">正式环境: https://spacemapper.cn</a>

# 短信验证码


## POST 发送短信验证码

POST /cgi/spi/sms/send

> Body 请求参数

```json
{
    "appId": 1488123032764416 ,
    "appKey": "1488123435417600",
    "appSecret": "hZUo6S8XdRosuqT6XFkGQ2bzQioI59WW",
    "mobile": "17335832703"
}
```

### 请求参数

| 名称   | 位置   | 类型                            | 必选  | 中文名       | 说明   |
| ---- | ---- | ----------------------------- | --- | --------- | ---- |
| body | body | [短信验证码发送请求](#schema短信验证码发送请求) | 是   | 短信验证码发送请求 | none |

> 返回示例

> 200 Response

```
{"code":0,"data":"string","msg":"string"}
```

### 返回结果

| 状态码 | 状态码含义                                                           | 说明           | 数据模型                                            |
| --- | --------------------------------------------------------------- | ------------ | ----------------------------------------------- |
| 200 | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)         | OK           | [ResultInfo«string»](#schemaresultinfo«string») |
| 201 | [Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)    | Created      | None                                            |
| 401 | [Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1) | Unauthorized | None                                            |
| 403 | [Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)  | Forbidden    | None                                            |
| 404 | [Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)  | Not Found    | None                                            |

<a id="opIdvalidateCodeUsingPOST"></a>

## POST 验证短信验证码

POST /cgi/spi/sms/validate

> Body 请求参数

```json
{
    "code": "396529",
    "appId": 1488123032764416 ,
    "appKey": "1488123435417600",
    "appSecret": "hZUo6S8XdRosuqT6XFkGQ2bzQioI59WW",
    "mobile": "17335832703"
}
```

### 请求参数

| 名称   | 位置   | 类型                            | 必选  | 中文名       | 说明   |
| ---- | ---- | ----------------------------- | --- | --------- | ---- |
| body | body | [短信验证码验证请求](#schema短信验证码验证请求) | 是   | 短信验证码验证请求 | none |

> 返回示例

> 200 Response

```
{"code":0,"data":true,"msg":"string"}
```

### 返回结果

| 状态码 | 状态码含义                                                           | 说明           | 数据模型                                              |
| --- | --------------------------------------------------------------- | ------------ | ------------------------------------------------- |
| 200 | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)         | OK           | [ResultInfo«boolean»](#schemaresultinfo«boolean») |
| 201 | [Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)    | Created      | None                                              |
| 401 | [Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1) | Unauthorized | None                                              |
| 403 | [Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)  | Forbidden    | None                                              |
| 404 | [Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)  | Not Found    | None                                              |

# 数据模型

<h2 id="tocS_ResultInfo«boolean»">ResultInfo«boolean»</h2>

<a id="schemaresultinfo«boolean»"></a>
<a id="schema_ResultInfo«boolean»"></a>
<a id="tocSresultinfo«boolean»"></a>
<a id="tocsresultinfo«boolean»"></a>

```json
{
  "code": 0,
  "data": true,
  "msg": "string"
}
```

ResultInfo«boolean»

### 属性

| 名称   | 类型             | 必选    | 约束   | 中文名 | 说明   |
| ---- | -------------- | ----- | ---- | --- | ---- |
| code | integer(int32) | false | none |     | none |
| data | boolean        | false | none |     | none |
| msg  | string         | false | none |     | none |

<h2 id="tocS_ResultInfo«string»">ResultInfo«string»</h2>

<a id="schemaresultinfo«string»"></a>
<a id="schema_ResultInfo«string»"></a>
<a id="tocSresultinfo«string»"></a>
<a id="tocsresultinfo«string»"></a>

```json
{
  "code": 0,
  "data": "string",
  "msg": "string"
}
```

ResultInfo«string»

### 属性

| 名称   | 类型             | 必选    | 约束   | 中文名 | 说明   |
| ---- | -------------- | ----- | ---- | --- | ---- |
| code | integer(int32) | false | none |     | none |
| data | string         | false | none |     | none |
| msg  | string         | false | none |     | none |

<h2 id="tocS_短信验证码发送请求">短信验证码发送请求</h2>

<a id="schema短信验证码发送请求"></a>
<a id="schema_短信验证码发送请求"></a>
<a id="tocS短信验证码发送请求"></a>
<a id="tocs短信验证码发送请求"></a>

```json
{
  "appId": 0,
  "appKey": "string",
  "appSecret": "string",
  "mobile": "string"
}
```

短信验证码发送请求

### 属性

| 名称        | 类型             | 必选   | 约束   | 中文名 | 说明       |
| --------- | -------------- | ---- | ---- | --- | -------- |
| appId     | integer(int64) | true | none |     | 应用ID     |
| appKey    | string         | true | none |     | 应用授权密钥ID |
| appSecret | string         | true | none |     | 应用授权密钥   |
| mobile    | string         | true | none |     | 手机号      |

<h2 id="tocS_短信验证码验证请求">短信验证码验证请求</h2>

<a id="schema短信验证码验证请求"></a>
<a id="schema_短信验证码验证请求"></a>
<a id="tocS短信验证码验证请求"></a>
<a id="tocs短信验证码验证请求"></a>

```json
{
  "appId": 0,
  "appKey": "string",
  "appSecret": "string",
  "code": "string",
  "mobile": "string"
}
```

短信验证码验证请求

### 属性

| 名称        | 类型             | 必选   | 约束   | 中文名 | 说明       |
| --------- | -------------- | ---- | ---- | --- | -------- |
| appId     | integer(int64) | true | none |     | 应用ID     |
| appKey    | string         | true | none |     | 应用授权密钥ID |
| appSecret | string         | true | none |     | 应用授权密钥   |
| code      | string         | true | none |     | 验证码      |
| mobile    | string         | true | none |     | 手机号      |
