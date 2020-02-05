upload:
	echo "/* Miyamoto-san https://github.com/masuidrive/miyamoto/ */" > main.gs
	echo "/* originated from (c) masuidrive 2014- License: MIT */" >> main.gs
	echo "/* forked by tambourine inc. */" >> main.gs
	echo "/* -------------------------------- */" >> main.gs
	cat scripts/*.js >> main.gs
	clasp push -f