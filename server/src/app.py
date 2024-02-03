import argparse
import datetime
import json
import re
import uuid
import zipfile

import cv2
import numpy as np
from aiohttp import web
from icecream import ic
from image_gen import ImageGenerator
from PIL import Image
from projects.project_manager import ProjectsManager
from transfer_learning.custom_dataset import CustomTestDataset, CustomTrainDataset
from transfer_learning.trained_model import CustomModel


async def init_project(request):
    flag = False
    if request.body_exists:
        json = await request.json()
        flag = pm.init_project(json)
    if flag:
        return web.Response(status=200)
    else:
        return web.Response(status=400, text="ERR: init_project failed")


async def save_labels(request):
    flag = False
    if request.body_exists:
        json = await request.json()
        flag = pm.save_labels(json["user"], json["data"])
    if flag:
        return web.Response(status=200)
    else:
        return web.Response(status=400, text="ERR: save_label failed.")


async def save_images(request):
    try:
        reader = await request.multipart()
        field = await reader.next()

        content_disposition = field.headers.get("Content-Disposition")
        filename = None
        if content_disposition:
            filename = re.findall('filename="(.+)"', content_disposition)
            if filename:
                filename = filename[0]

        if not filename:
            return web.Response(text="File name not found in the request", status=400)
        user = filename[:-4]

        image_dir, work_dir = pm.get_images_dir(user)
        zip_file = work_dir / filename
        ic(zip_file)
        with open(zip_file, "wb") as zf:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                zf.write(chunk)

        with zipfile.ZipFile(zip_file, "r") as zf:
            zf.extractall(work_dir)

        for image_path in work_dir.glob("*"):  # 画像ファイルの拡張子に合わせてパターンを調整
            try:
                # 画像の読み込み
                image = cv2.imread(str(image_path))
                height, width = image.shape[:2]
                target_size = 512

                # 縦幅と横幅のうち、より大きい方を基準にリサイズ
                if height <= width:
                    new_height = target_size
                    new_width = int(width * (target_size / height))
                else:
                    new_width = target_size
                    new_height = int(height * (target_size / width))

                resized_image = cv2.resize(image, (new_width, new_height))  # 画像のリサイズ

                # 画像の中央からトリミング
                h, w, _ = resized_image.shape
                if h >= 512 or w >= 512:
                    center_x, center_y = w // 2, h // 2
                    half_size = 256  # 画像の半分のサイズ
                    cropped_image = resized_image[
                        center_y - half_size : center_y + half_size,
                        center_x - half_size : center_x + half_size,
                    ]

                    # トリミングされた画像を保存
                    output_path = image_dir / (image_path.stem + ".png")
                    cv2.imwrite(str(output_path), cropped_image)

                    print(f"{image_path.name} をリサイズおよびトリミングしました。")
                    image_path.unlink()
                else:
                    print(f"{image_path.name} はリサイズの対象外です。")
            except Exception as e:
                print(f"エラー: {e}")

        return web.Response(text="File successfully uploaded.")

    except Exception as e:
        return web.Response(text=f"Error: {str(e)}", status=500)


async def gen_images(request):
    user = request.rel_url.query["user"]
    image_id = request.rel_url.query["imageId"]
    mask_id = request.rel_url.query["maskId"]
    prompt = request.rel_url.query["prompt"]
    cfg = request.rel_url.query["cfg"]
    seed = request.rel_url.query["seed"]
    num = request.rel_url.query["num"]

    image_dir, _ = pm.get_images_dir(user)

    ic(prompt, cfg)
    if image_id == "blank":
        gen_images = gen.genSD(prompt, float(cfg), int(seed), int(num))
    elif mask_id == "mask":
        base_image = Image.open(image_dir / (image_id + ".png"))
        gen_images = gen.genPix2Pix(base_image, prompt, float(cfg), int(seed), int(num))
    else:
        base_image = Image.open(image_dir / (image_id + ".png"))
        mask = Image.open(image_dir / (mask_id + ".png"))
        gen_images = gen.genInpaint(
            base_image, mask, prompt, float(cfg), int(seed), int(num)
        )

    file_paths = []
    gen_names = ""
    for gen_image in gen_images:
        filename = str(uuid.uuid4()) + ".png"
        gen_names += filename + ","
        path = image_dir / filename
        gen_image_bgr = np.array(gen_image)[:, :, [2, 1, 0]]
        cv2.imwrite(str(path), gen_image_bgr)
        file_paths.append(path)

    pm.save_gen_history(
        user,
        {
            "time": str(datetime.datetime.now()),
            "image_id": image_id,
            "prompt": prompt,
            "cfg": cfg,
            "seed": seed,
            "num": num,
            "gen_images": gen_names,
        },
    )

    with zipfile.ZipFile("image.zip", "w", zipfile.ZIP_STORED) as zf:
        for path in file_paths:
            ic(path)
            zf.write(path)

    with open("image.zip", mode="rb") as f:
        if gen_images:
            return web.Response(
                status=200, content_type="application/zip", body=f.read()
            )
        else:
            return web.Response(status=400, text="image can't generate")


async def gen_sample_images(request):
    try:
        user = request.rel_url.query["user"]
        num = request.rel_url.query["num"]

        pm.save_gen_history(user, {"time": str(datetime.datetime.now()), "num": num})

        image_dir, _ = pm.get_images_dir(user)
        ret_num = int(num)

        with zipfile.ZipFile("image.zip", "w", zipfile.ZIP_STORED) as zf:
            counter = 0
            for path in image_dir.glob("*"):
                ic(path)
                zf.write(path)
                counter += 1
                if counter >= ret_num:
                    break

        with open("image.zip", mode="rb") as f:
            if gen_images:
                return web.Response(
                    status=200, content_type="application/zip", body=f.read()
                )

    except Exception as e:
        return web.Response(text=f"Error: {str(e)}", status=500)


async def train_model(request):
    try:
        user = request.rel_url.query["user"]
        user_dir = pm.get_userdir(user)
        img_dir, _ = pm.get_images_dir(user)
        _, id2imag_path = pm.get_json_paths(user)

        model = CustomModel()
        train = CustomTrainDataset(img_dir, id2imag_path)
        model.train(user_dir, train)
        await train_model_g0(user_dir, img_dir, id2imag_path)
        return web.Response(text="Successfully train the model.", status=200)

    except Exception as e:
        return web.Response(text=f"Error: {str(e)}", status=500)


async def train_model_g0(user_dir, img_dir, id2imag_path):
    train = CustomTrainDataset(img_dir, id2imag_path, g0only=True)
    if len(train) == 0:
        return
    model = CustomModel()
    model.train(user_dir, train, g0only=True)
    return


async def test_images(request):
    try:
        user = request.rel_url.query["user"]
        user_dir = pm.get_userdir(user)
        img_dir, _ = pm.get_images_dir(user)
        _, id2imag_path = pm.get_json_paths(user)

        test = CustomTestDataset(img_dir, id2imag_path)
        ret = []
        model = CustomModel()
        model.load_latest_model(user_dir)

        for i in range(len(test)):
            image, _, name = test[i]
            image = image.unsqueeze(dim=0)
            res = model.test(image)
            ret.append({"id": name, "result": float(res)})
        response_body = json.dumps(ret)

        return web.Response(
            status=200, text=response_body, content_type="application/json"
        )

    except Exception as e:
        return web.Response(text=f"Error: {str(e)}", status=500)


# CORS for dev
@web.middleware
async def cors_middleware(request, handler):
    ic(request)
    pm.save_request_log(request)
    headers = {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*",
    }
    if request.method == "OPTIONS":
        return web.Response(headers=headers)
    try:
        response = await handler(request)
        for key, value in headers.items():
            response.headers[key] = value
        return response
    except web.HTTPException as e:
        for key, value in headers.items():
            e.headers[key] = value
        raise e


parser = argparse.ArgumentParser(description="backend for idp-web")
parser.add_argument(
    "--host", default="127.0.0.1", help="Host for HTTP server (default: 127.0.0.1)"
)
parser.add_argument(
    "--port", type=int, default=8080, help="Port for HTTP server (default: 8080)"
)
args = parser.parse_args()

if __name__ == "__main__":
    pm = ProjectsManager()
    gen = ImageGenerator()

    app = web.Application(middlewares=[cors_middleware])
    app.router.add_post("/init", init_project)
    app.router.add_post("/upload-images", save_images)
    app.router.add_post("/upload-labels", save_labels)
    app.router.add_get("/gen-images", gen_images)
    app.router.add_get("/train", train_model)
    app.router.add_get("/test-images", test_images)

    web.run_app(app, access_log=None, host=args.host, port=args.port)
