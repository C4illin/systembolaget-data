# Systembolaget Data
[![Github](https://img.shields.io/github/last-commit/C4illin/systembolaget-data?logoColor=white&style=for-the-badge&label=Updated)](https://github.com/C4illin/systembolaget-data/commits/main)
[![Github](https://img.shields.io/github/stars/C4illin/systembolaget-data?logo=github&logoColor=white&style=for-the-badge)](https://github.com/C4illin/systembolaget-data/stargazers/)
[![Github](https://img.shields.io/website?down_color=red&down_message=offline&style=for-the-badge&up_color=limegreen&up_message=online&url=https%3A%2F%2Falkolist.github.io%2F)](https://alkolist.github.io/)



Systembolaget removed their official api for products, this is a workaround.

Currently used by:
https://alkolist.github.io/

Website repo:
https://github.com/alkolist/alkolist.github.io

## Paths:

`/v1/products` includes all products and some information about them.

## Install:

```yml
# docker-compose.yml

version: "3"
services:
  systembolaget-data:
    image: ghcr.io/c4illin/systembolaget-data:main
    container_name: systembolaget-data
    restart: unless-stopped
    ports:
      - 3000:3000
```
