FROM nginx:alpine
COPY dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY env.json.template /etc/nginx/templates/env.json.template
EXPOSE 80
