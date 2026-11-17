# Round 13：失败路线、修复和第一开放门槛

本文件记录命题级边界，不把一种方法失败等同于总目标被反驳。每项的证明与原范围见精确结果登记。

## 1. 已在本轮修复的问题

1. **只在自由半径点核对曲线比较。** CC 在所有充分小的正实对数半径直接计算完整 graded residue 与 primitive slope；可公度半径含额外 Laurent residue variables，常数域次数保持。
2. **只检测分开的边缘符号。** CS/SD 对整个 raw incident relation 空间进行一次带权 Stokes，保留混合关系与完整配对 Hessian。
3. **Picard 完成之后仍使用完成之前的核。** 最后 faithful separator 放在 SP 完成之后；新的零旧列标记和 tangent satellites 都纳入。
4. **表面单位组依赖后选环带。** UA 先冻结有限 trace 空间、几何、单位与中央提升，再选任意紧区间。
5. **只有一个 Gauss 截面落入乘积。** UF 的有限有理包控制整个完成后核心纤维，再用 properness 得到普通开邻域。
6. **为证明局部作用先要求全局原函数。** PA 固定一个旧 P_τ。其外由原始 OR 处理，其内由有限顶锥/二维面/射线族覆盖；普通 locality 允许局部元组不同。
7. ** chosen direct lift 的 horn 失败使标量比较完全停滞。** HN 在实际选定根定义域上用 QE 和 Gauss 变量证明有限范数识别；它不要求 direct lift 在每个角区都近似正确。

## 2. 已反驳的捷径

| 捷径 | 反证 | 原范围限制 |
|---|---|---|
| 所有正角向局部原函数 + D=d′d″ current 闭 ⇒ 全局原函数 | PK/HP 非零 Killing 类 | 实有限 fan；不声称 actual analytic zero 实现 |
| 上述资料自动给固定 Q 误差趋零 | KG 的正 strain-measure 差距 | 固定实 fan；actual graph refinement 可改变问题 |
| PL 坐标图仅按 Jacobian 运输 strain | GD 的 Hessian wall drift | 精确分布链式法则，含秩退化 |
| 所有 residue units 可提升成域 section 或保留全部有限方程 | RE 椭圆曲线除子 | 不否定逐个有限单位提升 |
| 一个 chosen direct lift 的比较自动覆盖整个中心邻域 | LH 全普通点 sharp horn | 加一个实际单位即可修复该例，故非普遍反例 |
| Hensel 有限范数图 + 中心 resultant bound ⇒ 整个邻域连续延拓 | HB 不可约 V²−V−A 的两支极限 | 否定每个有限实际 tuple 的整邻域延拓，不否定局部根域构造 |
| 正闭 S、有界 PS Z、点支撑 ⇒ 残余零 | CR 的闭正实平面例，临界 δ² 质量 | 例子不是 actual zero，ambient D[Z]≠0 |
| 剩余秩三仅在可数 moment 层，所以不带质量 | PA12 原始环面单位 Gauss 原子 | 这是正 BT 测度，不是 actual zero 的作用 |

## 3. 不可交换的两个源清单

R11 FA 在指定旧源 P 上忠实。加入分离函数 g 后，P 保持被忠实嵌入；这不意味着新 tuple (f,g) 的整个 S_(f,g) 都被同一坐标图忠实嵌入。

PA 用一个冻结的旧 P_τ 做几何清单。其余实际点用原始 scalar rank 条件处理。若要求一个全局原函数或固定 Q 序列，就不能据此删除新源；GD/HS 的全新源 strain 与相容性仍需要证明。

## 4. 中心质量：第一条未证估计

PA 在给定模型中只留下 c_S(P)δ_y。完整 cutoff 计算给出 C δ^-2 μ(B_2δ)。从有界系数与有限测度不能推出 μ(B_2δ)=o(δ²)；CR 给出临界阶的实诊断。MT 已利用完整受保护转置与闭性证明 O(δ²)，LE 据此把高阶 scalar jets 的贡献降为 O_S(δ)。剩余 leading paired class 的消去仍未证明。

原始背景 S 的“剩余数值除子类”尚未构造。可以合法定义实际 cap 势的 BT 原子 m_S(L,M)=(Dq_L∧Dq_M∧S)({y})。但不能先假定 m_S 经过 L·M 的数值类分解，再用数值关系证明 actual-zero 下降；该分解本身就是需要证明的下降步骤。

R6 已证明固定连续 BT slots 对同一普通域上的背景弱收敛连续，并已在 W_loc（正闭实际 delta 背景的同域 ordinary 弱闭包）解决相应作用。尚未证明任意允许 S 都局部属于 W_loc。不能把这个未证密度放进定义或当作文献常识。

详见 `notes/geom13_central_background_cap_audit.md`。

## 5. 全局 exact-lift 与受控逼近仍未完成的部分

- JF7 的每个 raw Hessian 条件必须对整个最终 incident family 成立；局部分支或边缘因子分别张成不够。
- 即使 JF7 成立，JF8 仍是非平凡全局 Killing 类。PK/HP 不允许从局部覆盖自动去掉它。
- GD 的实际 nodal units 修复指定旧核心；HS 的新源投影在旧二维骨架，且一个旧面上可解相对 jet。不同旧面在旧射线上的相容性仍未解决。
- 在 HS 明确给定的 incidence、Picard 和实际 jet transport 前提下，旧 paired quotient 可以单射保留。纯 subdivisions 或 permissible blowups 不构成一般杀类机制。
- HN 不提供跨所有新根边界的连续 covector。HB 给出了不可延拓的实际边界，需保留局部根域或使用 singular/direct pairing。

## 6. 外部来源边界

- Ducros finite Gauss separation 使用原域部分及 erratum，不使用为 universal base change 提供的扩域条款。
- Luxton–Qu 的已核对 schön compactification 定理带有代数闭、特征零假设，不能直接移植到固定有限剩余域。
- DHLY 固定 skeleton 的有限生成结论没有证明所有 ordinary added sources 的闭合；其特定 defect 例不能当作原有限 K 反例。
- HN 使用 ACVF 的 valuation-dominance QE，包含混合特征的情况；没有以 equicharacteristic-zero Pas 结果替代。
- Parallel 深度检索因连接要求未产生结果。没有把它记为完成的研究或来源；已直接核对可访问的原始论文。

## 7. 总目标仍 OPEN

一般原始 A1/GQ/KC12/RV4/PSO12/13、variable-PS/CTO、GK 高次接口、一般普通粘合与自然性仍 OPEN。C1 coefficient-one 和 B1 raw=outer 继续按历史已反驳范围保留。当前局部模型结果不允许改变域、绝对值、positivity cone 或 absolute carrier，也不允许把 current 等式当作全部 GK tests 等式。

## 8. 临界 tangent 与 PS 配对接口已闭合，实际消去仍 OPEN

MT 的弱子列收敛最初只在 smooth real tests 上成立。PT 直接核对了保留的 R6 `lem:r6-weighted-pws-error`（来自 R4 71.1–71.2、71.4）：对每个系数墙，法向对角质量在宽 ε 条带中为 O(ε)，混合项由 middle-positive 矩阵的 Cauchy–Schwarz 得到 O(√ε)。因而相容 finite-PS tests 可一致平滑，即使极限给墙及其交面正质量，配对仍收敛。这个估计是旧成果；本轮明确验证其与真实背景临界缩放的接口。

结合 MT 的完整系数转置和 LE 的实际标量一阶化，已证明对每个临界 tangent T₀ 都有

\[
c_S(P)=-\langle T_0,Z_0\wedge D\rho\rangle.
\]

这一配对保留所有联合符号与面值，且不依赖 tangent 唯一性。尚未证明每个实际可实现 T₀ 都消去 actual zero 的 Z₀；也未证明 T₀ 属于实际 W_loc 类。随意选一个正闭实圆锥 current 或旧 Killing 对偶都不能替代这个实际可实现族。


## 9. 球面实分类不等于实际联合可实现性

SR 已将临界实正闭圆锥 current 精确分类为有限 PSD、切向、球面散度零的矩阵测度 M，并把实际中心系数写成完整的质量项减梯度项。实闭性和该角向平衡仍未推出 actual-zero 配对消去。应研究实际关系的 Z₀ 与原背景的 M 在同一原芽、所有实际细化上的联合限制。不能单独扩大两个边缘的允许集合，再把它们的任意配对当成原问题；也不能把实分类误写成实际背景实现定理。


## 10. 球面对称梯度的第一条仍缺少的墙估计

令 φ=Σc_α h_α k_α，v=½∇_S φ。每个共同线性胞腔内，Hess_S h_α=−h_α g_S，因此

\[
e_S(v)=(Z_0)_{\rm tan}-(Z_0)_{rr}g_S.
\]

若 v 是全局光滑切向场，SR14a 立即消去球面配对。但通常 φ 仅连续分片光滑，v 的跳跃为墙的法向方向；其分布 strain 还带法向–法向墙项。宽 ε 平滑使该项出现 ε^{-1} 系数。PT 的正闭条带估计只能给

\[
\varepsilon^{-1}M_{nn}(\{|\ell|\lesssim\varepsilon\})
=O(1),
\]

不能给 o(1)。球面与固定环带中的欧氏法向比较只改变有界常数；Mθ=0 保证切向投影不改变该法向收缩。故逐胞腔 strain 解不是已有消去证明。下一步须利用 actual-zero 的完整联合关系消去这些临界墙通量，或构造另一个具备合法全局墙控制的原函数。这里只标出已有估计不能闭合的位置，不声称原范围反例。
