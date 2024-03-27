import omegaconf
import torch

from diffusers import StableDiffusionPipeline
from diffusers import StableDiffusionImg2ImgPipeline
from gen_models.inpaint import Inpaint
from gen_models.insturctpix2pix import InsturctPix2Pix


class ImageGenerator:
    def __init__(self) -> None:
        self.cfg = omegaconf.OmegaConf.load("gen_models/stable-v2.yml")
        self.inpaint = Inpaint(self.cfg, 512, self.cfg.steps_all)
        self.pix2pix = InsturctPix2Pix(self.cfg, 512)

        _model_id = "stabilityai/stable-diffusion-2-1-base"
        self._device = "cuda"
        self.sd_pipe = StableDiffusionPipeline.from_pretrained(
            _model_id, torch_dtype=torch.float16
        )
        self.sd_pipe = self.sd_pipe.to(self._device)

    def genInpaint(self, base_image, mask, prompt, cfg, seed, n_images):
        neg_prompt = ""
        img = {}
        img["image"] = base_image
        img["mask"] = mask
        steps = 30
        generator = torch.Generator("cuda").manual_seed(seed)

        with torch.autocast("cuda"):
            images = self.inpaint.inpaint(
                prompt, n_images, neg_prompt, img, cfg, steps, generator, seed
            )
        return images

    def genPix2Pix(self, base_image, prompt, cfg, seed, n_images):
        img = {}
        img["image"] = base_image
        steps = 30
        # めっちゃ適当に作った、img_guidance算出式。いい感じなのでこれでOK（）
        img_guidance = (15 - cfg) / 2 - 1

        with torch.autocast("cuda"):
            images = self.pix2pix.run(
                prompt, n_images, img, steps, seed, cfg, img_guidance
            )
        return images

    def genSD(self, prompt, cfg, seed, n_images):
        steps = 30
        generator = torch.Generator(self._device).manual_seed(seed)
        with torch.autocast(self._device):
            images = self.sd_pipe(
                prompt=prompt,
                num_images_per_prompt=n_images,
                num_inference_steps=steps,
                guidance_scale=cfg,
                generator=generator,
            ).images
            return images
