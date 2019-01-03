FROM node:8.9.1

# CREATE HOST FOLDER
RUN mkdir /socket

COPY . /socket

WORKDIR /socket

# INSTALL PACKAGES
RUN npm i

CMD ["npm", "run", "prod"]
