timestamp=`date +%s`
filename=$timestamp.tex
curl $1 > $filename 2> /dev/null
pdflatex $filename > /dev/null
mv $timestamp.pdf _$timestamp.pdf
rm $timestamp.*
mv _$timestamp.pdf $timestamp.pdf
echo $timestamp.pdf

