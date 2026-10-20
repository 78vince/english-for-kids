#!/usr/bin/env python3
"""LET'S GO 獨立 app 的識別標誌產生器：黃色 "GO" + 藍色漸層底（皆取自 design token）。

顏色：漸層 = --gradient-primary（135deg，--color-primary-700 #347FBC → --color-primary-500 #5B9CD1）；
字 = --color-accent-yellow #FFD873。字型 Poppins Bold（需要本機已安裝）。
用法：python3 scripts/gen-letsgo-logo.py <輸出資料夾>
輸出：icon-512.png、icon-192.png、apple-touch-icon.png（180，無圓角不透明）、favicon-32.png、favicon-16.png、favicon.ico
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
import numpy as np
C700=(0x34,0x7F,0xBC); C500=(0x5B,0x9C,0xD1); YEL=(0xFF,0xD8,0x73)
FONT="/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
def make(size, rounded=True, text_scale=0.56):
    S=size*4
    yy,xx=np.mgrid[0:S,0:S]; t=((xx+yy)/(2*(S-1)))[...,None]
    img=Image.fromarray((np.array(C700)*(1-t)+np.array(C500)*t).astype('uint8'),'RGB').convert('RGBA')
    f=ImageFont.truetype(FONT,int(S*text_scale)); d=ImageDraw.Draw(img)
    bb=d.textbbox((0,0),"GO",font=f); w,h=bb[2]-bb[0],bb[3]-bb[1]
    x=(S-w)/2-bb[0]; y=(S-h)/2-bb[1]
    ImageDraw.Draw(img).text((x,y),"GO",font=f,fill=YEL+(255,))
    if rounded:
        m=Image.new('L',(S,S),0); ImageDraw.Draw(m).rounded_rectangle((0,0,S-1,S-1),radius=int(S*0.22),fill=255); img.putalpha(m)
    return img.resize((size,size),Image.LANCZOS)
if __name__=="__main__":
    out=sys.argv[1] if len(sys.argv)>1 else "."; os.makedirs(out,exist_ok=True)
    make(512).save(f"{out}/icon-512.png"); make(192).save(f"{out}/icon-192.png")
    make(180,rounded=False).convert('RGB').save(f"{out}/apple-touch-icon.png")
    make(32,text_scale=0.62).save(f"{out}/favicon-32.png"); make(16,text_scale=0.66).save(f"{out}/favicon-16.png")
    ico=[make(s,text_scale=0.62) for s in (16,32,48)]
    ico[0].save(f"{out}/favicon.ico",format="ICO",sizes=[(16,16),(32,32),(48,48)],append_images=ico[1:])
