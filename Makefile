sass:
	sass --no-source-map -s compressed --watch themes/moroz/assets/css/main.scss themes/moroz/assets/css/main.css

watch:
	hugo server -D

build:
	hugo --minify
