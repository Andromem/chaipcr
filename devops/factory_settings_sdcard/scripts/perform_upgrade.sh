#!/bin/bash

exit_with_message () {
	echo "UPGRADE: $1"
	if [ ! -z "$3" ]
	then
		echo Writing results to $3
		echo "$1" >> $3
	fi
	exit $2
}

if ! id | grep -q root; then
	exit_with_message "must be run as root" 5 $1
fi

if [ -e /dev/mmcblk1p4 ] ; then
	sdcard_dev="/dev/mmcblk0"
	eMMC="/dev/mmcblk1"
fi

if [ -e /dev/mmcblk0p4 ] ; then
	sdcard_dev="/dev/mmcblk1"
	eMMC="/dev/mmcblk0"
fi

if [ ! -e "${eMMC}p4" ]
then
        exit_with_message "Proper eMMC partitionining not found!" 1 $1
fi

verify_checksum () {
        image_filename_upgrade1="/sdcard/upgrade/upgrade.img.tar"
#       image_filename_upgrade1="~/tmp2out/p2/upgrade.img.tar"
#	image_filename_upgrade1="/home/mahammad/tmp2out/p2/upgrade.img.tar"

#	ls -ahl  $image_filename_upgrade1

	if [ ! -e $image_filename_upgrade1 ]
	then
		exit_with_message "Upgrade image not found!" 2 $1
	fi

	image_filename_prfx="upgrade"
	image_filename_rootfs="$image_filename_prfx-rootfs.img.gz"
	image_filename_data="$image_filename_prfx-data.img.gz"
	image_filename_boot="$image_filename_prfx-boot.img.gz"
	image_filename_pt="$image_filename_prfx-pt.img.gz"
	checksums_filename="$image_filename_prfx-checksums.txt"

	check_sum=$( tar xOf $image_filename_upgrade1 $checksums_filename )
	if [ -z "$check_sum" ]
	then
		exit_with_message "Incompatable upgrade image: No checksum file found!" 4 $1
	fi
	echo "Checksums: $check_sum"

	files_tocheck=( "$image_filename_pt" "$image_filename_boot" "$image_filename_rootfs" )
#	fileItemString=$(echo $check_sum |tr "\n" " ")
#	fileItemArray=($fileItemString)

#	Length=${#fileItemArray[@]}
#	echo "Length=$Length"
#	if [ $Length -lt 11 ]
#	then
#		echo "Incompatable upgrade image: Checksum file not found"
#		exit 4
#	fi

#	check_sum1="${fileItemArray[3]}"
#	echo "pt checksum: $check_sum1"
#	for itm in "${fileItemArray[@]}"
#	do
#		echo "- $itm"
#	done

	for fl in "${files_tocheck[@]}"
	do
		echo "Checking $fl"
		file_checksum=$( tar xOf $image_filename_upgrade1 $fl | md5sum | awk '{ print $1 }' )
		echo "Calculated checksum: $file_checksum"
		if [[ $check_sum == *"$file_checksum"* ]]
		then
			echo "Checksum ok!"
		else
			exit_with_message "Checksum error!" 6 $1
		fi
	done
}

BASEDIR=$(dirname $0)

echo timer > /sys/class/leds/beaglebone\:green\:usr0/trigger
echo "Verifying.."
verify_checksum

set_sdcard_uEnv () {
	cp ${uEnvPath}/uEnv.txt ${uEnvPath}/uEnv.org.txt
	cp ${uEnvPath}/uEnv.sdcard.txt ${uEnvPath}/uEnv.txt
	sync
}

reset_sdcard_uEnv () {
	cp ${uEnvPath}/uEnv.org.txt ${uEnvPath}/uEnv.txt
	sync
}

uEnvPath=/tmp/uEnvPath

if [ ! -e "$uEnvPath" ]
then
	mkdir -p ${uEnvPath} > /dev/null
fi

#umount ${uEnvPath} > /dev/null
mount ${eMMC}p1 ${uEnvPath} -t vfat
set_sdcard_uEnv
umount ${uEnvPath}> /dev/null

mount ${sdcard_dev}p1 ${uEnvPath} -t vfat
set_sdcard_uEnv

NOW=$(date +"%m-%d-%Y %H:%M:%S")
echo "Resume flag up at $NOW"
echo "Upgrade started at: $NOW">${uEnvPath}/unpack_resume_autorun.flag
echo "1">${uEnvPath}/restart_counter.ini
echo "1">${uEnvPath}/unpack_stage.ini

umount ${uEnvPath}

echo "Restarting to packing eMMC image.."
echo default-on > /sys/class/leds/beaglebone\:green\:usr0/trigger
sh $BASEDIR/rebootx.sh

exit_with_message Success 0 $1

