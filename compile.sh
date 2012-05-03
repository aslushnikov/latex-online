cd tmp
filename=$1
timestamp=`basename $filename .tex`
pdflatex $filename > /dev/null

has_toc=`grep -l '\tableofcontents' $filename | wc -l`
if [ $has_toc == "1" ]; then
    pdflatex $filename > /dev/null
fi

mv $timestamp.pdf _$timestamp.pdf
rm $timestamp.*
mv _$timestamp.pdf $timestamp.pdf
echo $timestamp.pdf

