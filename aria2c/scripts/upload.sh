#!/usr/bin/env bash

CHECK_CORE_FILE() {
    CORE_FILE="$(dirname $0)/core.sh"
    if [[ -f "${CORE_FILE}" ]]; then
        . "${CORE_FILE}"
    else
        echo && echo "!!! core file does not exist !!!"
        exit 1
    fi
}

CHECK_CORE_FILE() {
    CORE_FILE="$(dirname $0)/core.sh"
    if [[ -f "${CORE_FILE}" ]]; then
        . "${CORE_FILE}"
    else
        echo && echo "!!! core file does not exist !!!"
        exit 1
    fi
}


CHECK_RCLONE() {
    if [[ ${RCLONE_REMOTE} == "" ]]; then
    echo "[INFO] $(date -u +'%Y-%m-%dT%H:%M:%SZ') Upload  isn't enabled"
    exit 0
    fi
}

TASK_INFO() {
    echo -e "
-------------------------- [${YELLOW_FONT_PREFIX}Task Infomation${FONT_COLOR_SUFFIX}] --------------------------
${LIGHT_PURPLE_FONT_PREFIX}Task GID:${FONT_COLOR_SUFFIX} ${TASK_GID}
${LIGHT_PURPLE_FONT_PREFIX}Number of Files:${FONT_COLOR_SUFFIX} ${FILE_NUM}
${LIGHT_PURPLE_FONT_PREFIX}First File Path:${FONT_COLOR_SUFFIX} ${FILE_PATH}
${LIGHT_PURPLE_FONT_PREFIX}Task File Name:${FONT_COLOR_SUFFIX} ${TASK_FILE_NAME}
${LIGHT_PURPLE_FONT_PREFIX}Task Path:${FONT_COLOR_SUFFIX} ${TASK_PATH}
${LIGHT_PURPLE_FONT_PREFIX}Aria2 Download Directory:${FONT_COLOR_SUFFIX} ${ARIA2_DOWNLOAD_DIR}
-------------------------- [${YELLOW_FONT_PREFIX}Task Infomation${FONT_COLOR_SUFFIX}] --------------------------
"
}

OUTPUT_UPLOAD_LOG() {
    LOG="${UPLOAD_LOG}"
    LOG_PATH="${UPLOAD_LOG_PATH}"
    OUTPUT_LOG
}

DEFINITION_PATH() {
    LOCAL_PATH="${TASK_PATH}"
    if [[ -f "${TASK_PATH}" ]]; then
       REMOTE_PATH="${RCLONE_REMOTE}:${RCLONE_UPLOAD_REMOTE_PATH}${DEST_PATH_SUFFIX%/*}"
    else
        REMOTE_PATH="${RCLONE_REMOTE}:${RCLONE_UPLOAD_REMOTE_PATH}${DEST_PATH_SUFFIX}"
    fi
}


EXTRACT_ARCHIVE() {

  archive_file="${TASK_PATH}"

  if [[ ! "$archive_file" =~ \.rar$ && ! "$archive_file" =~ \.zip$ && ! "$archive_file" =~ \.7z$ ]]; then
    return 1
  fi

  extracted_files=$(7z l -ba "$archive_file" | awk '{
  match($0,/\S+$/)
  if (RSTART && (substr($0, RSTART) ~ /\.mp4$|\.mkv$/)) {
    print substr($0, RSTART)
  }
 }'
)

  if [ ${#extracted_files[@]} -eq 1 ]; then
    extracted_file="${extracted_files[0]}"

    if [[ "$extracted_file" =~ \.mp4$ || "$extracted_file" =~ \.mkv$ ]]; then
      7z e -bso0 -bsp0 -y "$archive_file" -o"${ARIA2_DOWNLOAD_DIR}"
      new_name="${archive_file%.*}.${extracted_file##*.}"
      mv "${ARIA2_DOWNLOAD_DIR}/$extracted_file" "$new_name"
      TASK_PATH="${new_name}"
      rm -rf  "$archive_file"
      return 0
    else
      return 1
    fi
  else
    return 1
  fi
}

UPLOAD_FILE() {
    echo -e "$(DATE_TIME) ${INFO} Start upload files..."
    TASK_INFO
    rclone move -v "${LOCAL_PATH}" "${REMOTE_PATH}"
    RCLONE_EXIT_CODE=$?
    if [ ${RCLONE_EXIT_CODE} -eq 0 ]; then
        UPLOAD_LOG="$(DATE_TIME) ${INFO} Upload done: ${LOCAL_PATH} -> ${REMOTE_PATH}"
        OUTPUT_UPLOAD_LOG
        DELETE_EMPTY_DIR
    else
        echo
        UPLOAD_LOG="$(DATE_TIME) ${ERROR} Upload failed: ${LOCAL_PATH}"
        OUTPUT_UPLOAD_LOG
    fi
}

CHECK_CORE_FILE "$@"
CHECK_SCRIPT_CONF
CHECK_RCLONE "$@"
CHECK_FILE_NUM
GET_TASK_INFO
GET_DOWNLOAD_DIR
CONVERSION_PATH
DEFINITION_PATH
CLEAN_UP
UPLOAD_FILE
exit 0
