# 构建阶段
FROM node:20-alpine

WORKDIR /app

# 设置 Yarn 国内镜像源
RUN yarn config set registry https://registry.npmmirror.com

# Copy environment file
COPY .env.production .env

# 复制 package.json 和 yarn.lock
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install

# 复制项目文件
COPY . .

# 构建项目
RUN yarn build

# 暴露端口
EXPOSE 5050

# 启动生产环境
CMD ["yarn", "start"] 