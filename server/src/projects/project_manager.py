import json
from pathlib import Path
from datetime import datetime


class ProjectsManager:
    def __init__(self) -> None:
        self._projects_dir = Path("./projects")

        if not self._projects_dir.exists():
            self._projects_dir.mkdir()

    def get_userdir(self, user):
        if user == "":
            return

        user_dir = self._projects_dir / user
        if not user_dir.exists():
            user_dir.mkdir()

        return user_dir

    def init_project(self, init_dict):
        user_dir = self.get_userdir(init_dict["user"])
        file_path = user_dir / "init_info.json"
        with open(file_path, "w", encoding="utf-8") as json_file:
            json.dump(init_dict, json_file, ensure_ascii=False, indent=4)
        return True

    def save_request_log(self, request):
        timestamp = datetime.now()
        file_path = self._projects_dir / "request_log.csv"
        with open(file_path, "a+", encoding="utf-8") as txt_file:
            txt_file.write(str(timestamp) + "," + str(request) + "\n")
        return True

    def save_labels(self, user, label_dict):
        user_dir = self.get_userdir(user)

        file_path = user_dir / "id2img.json"
        with open(file_path, "w", encoding="utf-8") as json_file:
            json.dump(label_dict, json_file, ensure_ascii=False, indent=4)
        return True

    def save_gen_history(self, user, gen_his_dict):
        user_dir = self.get_userdir(user)

        file_path = user_dir / "gen_his.json"
        if file_path.is_file():
            with open(file_path, "r", encoding="utf-8") as json_file:
                data = json.load(json_file)
        else:
            data = []

        data.append(gen_his_dict)
        with open(file_path, "w", encoding="utf-8") as json_file:
            json.dump(data, json_file, ensure_ascii=False, indent=4)
        return True

    def get_json_paths(self, user):
        user_dir = self.get_userdir(user)
        init_path = user_dir / "init_info.json"
        id2img_path = user_dir / "id2img.json"
        return init_path, id2img_path

    def get_images_dir(self, user):
        user_dir = self.get_userdir(user)

        image_dir = user_dir / "images"
        work_dir = user_dir / "work"
        if not image_dir.exists():
            image_dir.mkdir()
        if not work_dir.exists():
            work_dir.mkdir()
        return (
            image_dir,
            work_dir,
        )
