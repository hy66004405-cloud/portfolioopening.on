from pathlib import Path
import struct, json
P=lambda f,*v:struct.pack('>'+f,*v)
patterns={
'A':'01110 10001 10001 11111 10001 10001 10001','B':'11110 10001 10001 11110 10001 10001 11110','C':'01111 10000 10000 10000 10000 10000 01111','D':'11110 10001 10001 10001 10001 10001 11110','E':'11111 10000 10000 11110 10000 10000 11111','F':'11111 10000 10000 11110 10000 10000 10000','G':'01111 10000 10000 10111 10001 10001 01111','H':'10001 10001 10001 11111 10001 10001 10001','I':'111 010 010 010 010 010 111','J':'00111 00010 00010 00010 10010 10010 01100','K':'10001 10010 10100 11000 10100 10010 10001','L':'10000 10000 10000 10000 10000 10000 11111','M':'10001 11011 10101 10101 10001 10001 10001','N':'10001 11001 10101 10011 10001 10001 10001','O':'01110 10001 10001 10001 10001 10001 01110','P':'11110 10001 10001 11110 10000 10000 10000','Q':'01110 10001 10001 10001 10101 10010 01101','R':'11110 10001 10001 11110 10100 10010 10001','S':'01111 10000 10000 01110 00001 00001 11110','T':'11111 00100 00100 00100 00100 00100 00100','U':'10001 10001 10001 10001 10001 10001 01110','V':'10001 10001 10001 10001 10001 01010 00100','W':'10001 10001 10001 10101 10101 11011 10001','X':'10001 10001 01010 00100 01010 10001 10001','Y':'10001 10001 01010 00100 00100 00100 00100','Z':'11111 00001 00010 00100 01000 10000 11111',
'0':'01110 10001 10011 10101 11001 10001 01110','1':'010 110 010 010 010 010 111','2':'01110 10001 00001 00010 00100 01000 11111','3':'11110 00001 00001 01110 00001 00001 11110','4':'00010 00110 01010 10010 11111 00010 00010','5':'11111 10000 10000 11110 00001 00001 11110','6':'01110 10000 10000 11110 10001 10001 01110','7':'11111 00001 00010 00100 01000 01000 01000','8':'01110 10001 10001 01110 10001 10001 01110','9':'01110 10001 10001 01111 00001 00001 01110',
'.':'0 0 0 0 0 1 1',',':'00 00 00 00 00 01 10',':':'0 1 1 0 1 1 0','!':'1 1 1 1 1 0 1','?':'01110 10001 00001 00010 00100 00000 00100',"'":'1 1 0 0 0 0 0','-':'000 000 000 111 000 000 000','/':'00001 00001 00010 00100 01000 10000 10000','+':'00000 00100 00100 11111 00100 00100 00000','(':'01 10 10 10 10 10 01',')':'10 01 01 01 01 01 10','>':'100 010 001 000 001 010 100','<':'001 010 100 000 100 010 001','=':'000 000 111 000 111 000 000','%':'11001 11010 00100 00100 01000 10110 00110',' ':'000 000 000 000 000 000 000'}
chars=sorted(list(range(32,127))+[0xb7,0x2018,0x2019,0x2014,0x2022])
alias={0xb7:'.',0x2018:"'",0x2019:"'",0x2014:'-',0x2022:'.'}
glyphs=[b''];metrics=[(600,0)];offsets=[0];data=b''
for code in chars:
 rows=patterns.get(alias.get(code,chr(code)).upper(),patterns['?']).split();points=[];ends=[]
 for y,row in enumerate(rows):
  for x,bit in enumerate(row):
   if bit=='1':
    left=x*100;bottom=(6-y)*100
    points += [(left,bottom),(left,bottom+100),(left+100,bottom+100),(left+100,bottom)];ends.append(len(points)-1)
 if points:
  g=P('hhhhh',len(ends),0,0,max(x for x,y in points),700)+P('H'*len(ends),*ends)+P('H',0)+bytes([1])*len(points)
  for axis in (0,1):
   prev=0
   for pt in points:g+=P('h',pt[axis]-prev);prev=pt[axis]
 else:g=b''
 g+=b'\0'*((-len(g))%4);glyphs.append(g);metrics.append(((len(rows[0])+1)*100,0))
for g in glyphs:data+=g;offsets.append(len(data))
n=len(glyphs);tables={}
tables['glyf']=data;tables['loca']=P('I'*len(offsets),*offsets);tables['hmtx']=b''.join(P('Hh',*m) for m in metrics)
tables['head']=P('IIIIHHQQhhhhHHhhh',0x10000,0x10000,0,0x5f0f3cf5,3,1000,0,0,0,0,500,700,0,8,2,1,0)
tables['hhea']=P('IhhhHhhhhhhhhhhhH',0x10000,850,-150,0,600,0,0,600,1,0,0,0,0,0,0,0,n)
tables['maxp']=P('IH'+'H'*13,0x10000,n,140,35,0,0,2,0,0,0,0,0,0,0,0)
# Unicode format 4, one segment per codepoint.
ends=chars+[65535];starts=ends;seg=len(ends);power=2**(seg.bit_length()-1)
sub=P('HHHHHHH',4,16+8*seg,0,seg*2,power*2,power.bit_length()-1,seg*2-power*2)+P('H'*seg,*ends)+P('H',0)+P('H'*seg,*starts)+P('H'*seg,*([(i+1-c)&65535 for i,c in enumerate(chars)]+[1]))+P('H'*seg,*([0]*seg))
tables['cmap']=P('HHHHI',0,1,3,1,12)+sub
names={1:'Opening Pixel',2:'Regular',4:'Opening Pixel Regular',6:'OpeningPixel-Regular'};strings=b'';records=b''
for i,value in names.items():b=value.encode('utf-16-be');records+=P('HHHHHH',3,1,0x409,i,len(b),len(strings));strings+=b
tables['name']=P('HHH',0,len(names),6+12*len(names))+records+strings
tables['post']=P('IIhhIIIII',0x30000,0,0,0,1,0,0,0,0)
os2=bytearray(78);struct.pack_into('>HhHHH',os2,0,0,500,400,5,0);os2[58:62]=b'OPEN';struct.pack_into('>HHHhhhHH',os2,62,64,32,0x2022,850,-150,0,850,150);tables['OS/2']=bytes(os2)
def checksum(b):b+=b'\0'*((-len(b))%4);return sum(struct.unpack('>'+'I'*(len(b)//4),b))&0xffffffff
count=len(tables);power=2**(count.bit_length()-1);header=P('IHHHH',0x10000,count,power*16,power.bit_length()-1,count*16-power*16);directory=b'';body=b'';headOffset=0
for tag,b in sorted(tables.items()):
 off=12+count*16+len(body);directory+=tag.encode()+P('III',checksum(b),off,len(b));body+=b+b'\0'*((-len(b))%4)
 if tag=='head':headOffset=off
font=bytearray(header+directory+body);struct.pack_into('>I',font,headOffset+8,(0xb1b0afba-checksum(bytes(font)))&0xffffffff)
Path('assets/fonts/opening-pixel.ttf').write_bytes(font)
