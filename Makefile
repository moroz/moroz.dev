sass:
	npx sass --no-source-map -s compressed themes/moroz/assets/css/main.scss themes/moroz/assets/css/main.css

watch:
	hugo server -D

build:
	hugo --minify
