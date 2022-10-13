BEGIN { 
    FS = ",";
    country="Unknown";

    printf("[\n");
}
{
    if ($2 != "")
        country = $2;
    name = $4;
    power = $7;
    date = $14;
    printf("\t{\"country\":\"%s\", \"name\":\"%s\", \"power\":%s, \"date\":\"%s\"},\n", country, name, power, date);
}
END {
    printf("]\n");
}
