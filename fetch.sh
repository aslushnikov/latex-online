cd tmp
timestamp=`date +%s`
filename=$timestamp.tex
curl -f $1 > $filename 2> /dev/null
if [ $? == 22 ]; then
    echo Failed to fetch document >&2
    rm $filename
    exit 1
fi
echo $filename
echo `cat $filename | md5`
