import datetime
from pathlib import Path
from typing import OrderedDict

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision.models import ResNet50_Weights, resnet50
from tqdm import tqdm


class CustomModel:
    def __init__(self) -> None:
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model = None
        self._init_model()

    def _init_model(self):
        self._model = resnet50(weights=ResNet50_Weights.DEFAULT)

        for param in self._model.parameters():
            param.requires_grad = False
        for param in self._model.fc.parameters():
            param.requires_grad = True

        num_features = self._model.fc.in_features
        self._model.fc = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.GELU(),
            nn.Linear(512, 64),
            nn.GELU(),
            nn.Linear(64, 8),
            nn.GELU(),
            nn.Linear(8, 1),
        )
        self._model.to(self._device)
        print("Init CustomModel finished")

    def train(self, user_dir, dataset, g0only=False):
        batch_size = 4
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        # 損失関数と最適化アルゴリズムを定義
        criterion = nn.L1Loss()
        optimizer = optim.AdamW(self._model.parameters(), lr=0.001)

        total_epoch = 50
        self._model.train()
        for epoch in range(total_epoch):
            with tqdm(dataloader) as pbar:
                pbar.set_description(f"[Epoch {epoch + 1}/{total_epoch}]")
                running_loss = 0.0
                for data in dataloader:
                    inputs, labels = data
                    inputs, labels = inputs.to(self._device), labels.to(self._device)

                    optimizer.zero_grad()
                    outputs = self._model(inputs)
                    loss = criterion(outputs, labels)
                    loss.backward()
                    optimizer.step()

                    running_loss += loss.item() * len(outputs)
                pbar.set_postfix(
                    OrderedDict(
                        Loss=running_loss / len(dataset),
                    )
                )

        self._tuned = True
        items_num = dataset.get_items_num()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        if g0only:
            torch.save(
                self._model.state_dict(),
                user_dir
                / ("g0only_model-" + timestamp + "-" + "_".join(map(str, items_num)) + ".pth"),
            )
        else:
            torch.save(
                self._model.state_dict(),
                user_dir
                / ("all_model-" + timestamp + "-" + "_".join(map(str, items_num)) + ".pth"),
            )
        print("Model Train Finished!")
        return

    def load_latest_model(self, user_dir, g0only=False):
        self._init_model()
        if g0only:
            model_files = list(Path(user_dir).glob("g0only_model-*.pth"))
        else:
            model_files = list(Path(user_dir).glob("all_model-*.pth"))

        if not model_files:
            raise FileNotFoundError("No trained model.")

        timestamps = [
            datetime.datetime.strptime(file.stem.split("-")[1], "%Y%m%d_%H%M%S")
            for file in model_files
        ]
        latest_model_index = timestamps.index(max(timestamps))
        latest_model_path = model_files[latest_model_index]
        print(latest_model_path)

        self._model.load_state_dict(torch.load(latest_model_path))
        self._tuned = True
        print("successfully loaded the latest model.")

    def load_selected_model(self, path):
        self._init_model()
        self._model.load_state_dict(torch.load(path))
        self._tuned = True

    def test(self, input):
        if not self._tuned:
            print("ERROR: test before learning!")
            return

        input = input.to(self._device)
        self._model.eval()
        with torch.no_grad():
            outputs = self._model(input).squeeze()
        return outputs
