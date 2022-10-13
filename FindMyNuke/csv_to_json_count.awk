BEGIN { 
    FS = ",";
    country="Unknown";
    count = 0;
    printf("[\n");
}
{
    if ($2 != "") {
        printf("\t{\"country\":\"%s\", \"count\":%d},\n", country, count);
        country = $2;
        count = 0;
    }
    count++;
}
END {
    printf("]\n");
}
