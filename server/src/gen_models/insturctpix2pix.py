import omegaconf
import torch
from diffusers import (DPMSolverMultistepScheduler,
                       StableDiffusionInstructPix2PixPipeline)

from .diffusion_base import DiffusionBase


class InsturctPix2Pix(DiffusionBase):
    def __init__(self, cfg: omegaconf.dictconfig.DictConfig, size: int = 256) -> None:
        super().__init__(cfg, size)

    def run(
        self,
        prompt,
        n_images,
        img,
        steps,
        seed,
        guidance_scale,
        img_guidance,
        neg_prompt="",
    ):
        generator = torch.Generator("cuda").manual_seed(seed)
        pipe = self.get_pipe()

        inp_img = img["image"]
        inp_img = inp_img.resize((self.size, self.size))

        result = pipe(
            prompt=prompt,
            image=inp_img,
            num_images_per_prompt=n_images,
            num_inference_steps=int(steps),
            guidance_scale=guidance_scale,
            image_guidance_scale=img_guidance,
            generator=generator,
        ).images
        self.update_state(f"Done. Seed: {seed}")

        return result

    def get_pipe(self):
        pipe = StableDiffusionInstructPix2PixPipeline.from_pretrained(
            "timbrooks/instruct-pix2pix",
            variant="fp16",
            torch_dtype=torch.float16,
        ).to("cuda")
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        self.set_mem_optim(pipe)
        return pipe
