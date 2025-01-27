
for i in {1..100}
do
  status=$(curl -s -o /dev/null -w "%{http_code}" api.capoeriasongbookcontributor.cc)
  echo $status
  if [[ $status = "429" ]]
  then
    echo "Blocked"
    exit 0
  else
    echo "Not blocked"
  fi
done

echo "Error the limit was not hit even after 100 calls"
exit 1