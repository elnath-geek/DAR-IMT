import json

import torch
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms


class CustomTrainDataset(Dataset):
    def __init__(self, img_dir, json_file, g0only=False):
        self._id2img = self.read_json(json_file)
        self._transform = transforms.Compose(
            [
                transforms.Resize(224),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                # The values calculated from the ImageNet dataset.
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                ),
            ]
        )
        self._dataset = []
        self._maxlabel = 0
        self.labeled_num = [0] * 10

        for path in img_dir.glob("*"):
            filename = path.stem
            item = list(filter(lambda x: x["id"] == filename, self._id2img))
            if item == []:
                continue
            label = float(item[0]["label"])
            if label > 0:
                if g0only and item[0]["generation"] != 0:
                    continue
                self._dataset.append({"path": path, "label": label})
                self.labeled_num[int(label)-1] += 1

    def get_items_num(self):
        return self.labeled_num

    def read_json(self, json_file):
        with open(json_file, "r") as f:
            data = json.load(f)
        return data

    def __len__(self):
        return len(self._dataset)

    def __getitem__(self, idx):
        path = self._dataset[idx]["path"]
        label = torch.Tensor([self._dataset[idx]["label"]])

        image = Image.open(path).convert("RGB")
        if self._transform:
            image = self._transform(image)

        return image, label


class CustomTestDataset(Dataset):
    def __init__(self, img_dir, json_file):
        self._id2img = self.read_json(json_file)
        self._transform = transforms.Compose(
            [
                transforms.Resize(224),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                # The values calculated from the ImageNet dataset.
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                ),
            ]
        )
        self._dataset = []

        for path in img_dir.glob("*"):
            filename = path.stem
            item = list(filter(lambda x: x["id"] == filename, self._id2img))
            if item == []:
                continue
            label = float(item[0]["label"])
            if label == -1:
                self._dataset.append({"path": path, "label": label, "name": filename})

    def read_json(self, json_file):
        with open(json_file, "r") as f:
            data = json.load(f)
        return data

    def __len__(self):
        return len(self._dataset)

    def __getitem__(self, idx):
        path = self._dataset[idx]["path"]
        label = torch.Tensor([self._dataset[idx]["label"]]).float()
        name = self._dataset[idx]["name"]

        image = Image.open(path).convert("RGB")
        if self._transform:
            image = self._transform(image)

        return image, label, name


class SharedTestDataset(Dataset):
    def __init__(self, img_dir):
        self._transform = transforms.Compose(
            [
                transforms.Resize(224),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                # The values calculated from the ImageNet dataset.
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                ),
            ]
        )
        self._dataset = []

        for path in sorted(img_dir.glob("*")):
            filename = path.stem
            self._dataset.append({"path": path, "label": float(filename[0:2])/10, "name": filename})

    def read_json(self, json_file):
        with open(json_file, "r") as f:
            data = json.load(f)
        return data

    def __len__(self):
        return len(self._dataset)

    def __getitem__(self, idx):
        path = self._dataset[idx]["path"]
        label = torch.Tensor([self._dataset[idx]["label"]]).float()
        name = self._dataset[idx]["name"]

        image = Image.open(path).convert("RGB")
        if self._transform:
            image = self._transform(image)

        return image, label, name
