cd tmp
timestamp=`date +%s`
filename=$timestamp.tex
curl $1 > $filename 2> /dev/null
echo $filename
echo `cat $filename | md5`
